-- =========================================================
-- PAYROLL MANAGEMENT SYSTEM
-- PostgreSQL Database Schema
-- =========================================================

-- =========================================================
-- ENUMS
-- =========================================================

DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'employee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE leave_status AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- =========================================================
-- EMPLOYEES
-- =========================================================

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,

  emp_code VARCHAR(50) UNIQUE NOT NULL,

  name VARCHAR(100) NOT NULL,

  email VARCHAR(150) UNIQUE NOT NULL,

  password_hash TEXT NOT NULL,

  role user_role NOT NULL DEFAULT 'employee',

  designation VARCHAR(100),

  department VARCHAR(100),

  gender VARCHAR(20),

  dob DATE,

  ctc NUMERIC(12,2) NOT NULL DEFAULT 0,

  advance NUMERIC(12,2) DEFAULT 0,

  tax_regime VARCHAR(10) NOT NULL DEFAULT 'old'
    CHECK (tax_regime IN ('old', 'new')),

  pan VARCHAR(10),

  pf_uan VARCHAR(12),

  account_number VARCHAR(18),

  ifsc_code VARCHAR(11),

  joining_date DATE,

  resignation_date DATE,

  -- =======================================================
  -- MONTHLY SALARY STRUCTURE - EARNINGS
  -- =======================================================

  basic NUMERIC(12,2) NOT NULL DEFAULT 0,

  hra NUMERIC(12,2) NOT NULL DEFAULT 0,

  special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,

  lta NUMERIC(12,2) NOT NULL DEFAULT 0,

  other_allowances NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- =======================================================
  -- MONTHLY DEDUCTIONS
  -- =======================================================

  epf NUMERIC(12,2) NOT NULL DEFAULT 0,

  professional_tax NUMERIC(12,2) NOT NULL DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- =========================================================
-- PAYSLIPS
-- =========================================================

CREATE TABLE IF NOT EXISTS payslips (
  id SERIAL PRIMARY KEY,

  employee_id INT NOT NULL
    REFERENCES employees(id)
    ON DELETE CASCADE,

  month INT NOT NULL
    CHECK (month BETWEEN 1 AND 12),

  year INT NOT NULL,

  -- =======================================================
  -- EARNINGS
  -- =======================================================

  basic NUMERIC(12,2) NOT NULL DEFAULT 0,

  hra NUMERIC(12,2) NOT NULL DEFAULT 0,

  special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,

  lta NUMERIC(12,2) NOT NULL DEFAULT 0,

  other_allowances NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Additional allowance entered during payroll generation
  allowances NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- =======================================================
  -- DEDUCTIONS
  -- =======================================================

  epf NUMERIC(12,2) NOT NULL DEFAULT 0,

  professional_tax NUMERIC(12,2) NOT NULL DEFAULT 0,

  advance NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Additional deduction entered during payroll generation
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- =======================================================
  -- FINAL
  -- =======================================================

  net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,

  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (employee_id, month, year)
);


-- =========================================================
-- ATTENDANCE
-- =========================================================

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,

  employee_id INT NOT NULL
    REFERENCES employees(id)
    ON DELETE CASCADE,

  work_date DATE NOT NULL DEFAULT CURRENT_DATE,

  status VARCHAR(20)
    CHECK (status IN ('present', 'absent', 'leave', 'paid_leave')),

  day_type VARCHAR(10)
    NOT NULL DEFAULT 'full'
    CHECK (day_type IN ('full', 'half')),

  note TEXT,

  check_in TIMESTAMP,

  check_out TIMESTAMP,

  UNIQUE (employee_id, work_date)
);


-- =========================================================
-- LEAVES
-- =========================================================

CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,

  employee_id INT NOT NULL
    REFERENCES employees(id)
    ON DELETE CASCADE,

  leave_type VARCHAR(30) NOT NULL,

  start_date DATE NOT NULL,

  end_date DATE NOT NULL,

  reason TEXT,

  status leave_status NOT NULL DEFAULT 'pending',

  applied_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE leaves ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE TABLE IF NOT EXISTS leave_documents (
  id SERIAL PRIMARY KEY,
  leave_id INT NOT NULL REFERENCES leaves(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes INT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  content BYTEA NOT NULL CHECK (octet_length(content) = size_bytes),
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leave_documents_leave_id_idx ON leave_documents(leave_id);


-- =========================================================
-- MIGRATION SAFETY
-- =========================================================
CREATE TABLE IF NOT EXISTS advances (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  instalment NUMERIC(12,2) NOT NULL CHECK (instalment > 0 AND instalment <= amount),
  first_recovery DATE NOT NULL CHECK (EXTRACT(DAY FROM first_recovery) = 1),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'active', 'paused', 'rejected')),
  disbursed_on DATE,
  payment_reference VARCHAR(150),
  created_by INT REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status IN ('active', 'paused')) = (disbursed_on IS NOT NULL)),
  CHECK (disbursed_on IS NULL OR payment_reference IS NOT NULL)
);

-- Keep existing advance records and recoveries when upgrading to loans.
ALTER TABLE advances
  ADD COLUMN IF NOT EXISTS record_type VARCHAR(20) NOT NULL DEFAULT 'loan'
    CHECK (record_type IN ('loan', 'salary_advance'));
CREATE INDEX IF NOT EXISTS advances_record_type_idx ON advances(record_type);

ALTER TABLE advances
  ADD COLUMN IF NOT EXISTS interest_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (interest_percentage >= 0 AND interest_percentage <= 100);
-- NULL preserves the terms of loans created before monthly flat interest.
ALTER TABLE advances
  ADD COLUMN IF NOT EXISTS instalment_count INT
    CHECK (instalment_count BETWEEN 1 AND 360);
ALTER TABLE advances DROP CONSTRAINT IF EXISTS advances_instalment_check;
-- PostgreSQL names the original cross-column instalment check advances_check.
ALTER TABLE advances DROP CONSTRAINT IF EXISTS advances_check;
ALTER TABLE advances ADD CONSTRAINT advances_instalment_check
  CHECK (instalment > 0 AND instalment <= amount + ROUND(amount * interest_percentage / 100, 2) * COALESCE(instalment_count, 1));

CREATE TABLE IF NOT EXISTS advance_recoveries (
  id SERIAL PRIMARY KEY,
  advance_id INT NOT NULL REFERENCES advances(id) ON DELETE CASCADE,
  payslip_id INT NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  UNIQUE (advance_id, payslip_id)
);
CREATE INDEX IF NOT EXISTS advance_recoveries_advance_idx ON advance_recoveries(advance_id);
CREATE INDEX IF NOT EXISTS advances_employee_idx ON advances(employee_id);

CREATE TABLE IF NOT EXISTS advance_events (
  id SERIAL PRIMARY KEY,
  advance_id INT NOT NULL REFERENCES advances(id) ON DELETE CASCADE,
  actor_id INT REFERENCES employees(id) ON DELETE SET NULL,
  action VARCHAR(30) NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- If your existing database already exists, the following
-- statements safely add the new columns.
-- =========================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS epf NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('present', 'absent', 'leave', 'paid_leave'));

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS professional_tax NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS advance NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE employees
  ALTER COLUMN advance DROP NOT NULL;

ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS hra NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS lta NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS other_allowances NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS epf NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS professional_tax NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS advance NUMERIC(12,2) NOT NULL DEFAULT 0;
