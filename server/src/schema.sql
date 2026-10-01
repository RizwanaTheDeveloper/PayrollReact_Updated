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
    CHECK (status IN ('present', 'absent', 'leave')),

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


-- =========================================================
-- MIGRATION SAFETY
-- =========================================================
-- If your existing database already exists, the following
-- statements safely add the new columns.
-- =========================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS epf NUMERIC(12,2) NOT NULL DEFAULT 0;

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