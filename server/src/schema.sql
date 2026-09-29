-- =========================================================
-- PAYROLL MANAGEMENT SYSTEM DATABASE SCHEMA
-- PostgreSQL
-- =========================================================


-- =========================================================
-- ENUM TYPES
-- =========================================================

DO $$
BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


DO $$
BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- =========================================================
-- EMPLOYEES
-- =========================================================

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,

    -- Login / identity
    emp_code VARCHAR(30) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    role user_role NOT NULL DEFAULT 'employee',

    -- Job information
    designation VARCHAR(80),
    department VARCHAR(80),

    -- Personal information
    gender VARCHAR(20),
    dob DATE,

    -- Salary information
    ctc NUMERIC(12,2) NOT NULL DEFAULT 0,
    basic NUMERIC(12,2) NOT NULL DEFAULT 0,
    hra NUMERIC(12,2) NOT NULL DEFAULT 0,
    special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
    lta NUMERIC(12,2) NOT NULL DEFAULT 0,
    other_allowances NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Government / bank information
    pan VARCHAR(10),
    pf_uan VARCHAR(12),
    account_number VARCHAR(18),
    ifsc_code VARCHAR(11),

    -- Tax information
    tax_regime VARCHAR(10) NOT NULL DEFAULT 'new'
        CHECK (tax_regime IN ('new', 'old')),

    -- Employment dates
    joining_date DATE,
    resignation_date DATE,

    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Basic date tracking
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
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

    day_type VARCHAR(10) NOT NULL DEFAULT 'full'
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

    leave_type VARCHAR(30) NOT NULL
        CHECK (leave_type IN ('casual', 'sick', 'paid')),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    reason TEXT,

    status leave_status NOT NULL DEFAULT 'pending',

    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CHECK (end_date >= start_date)
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

    year INT NOT NULL
        CHECK (year BETWEEN 2000 AND 2100),

    -- Salary components
    basic NUMERIC(12,2) NOT NULL DEFAULT 0,
    hra NUMERIC(12,2) NOT NULL DEFAULT 0,
    special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
    lta NUMERIC(12,2) NOT NULL DEFAULT 0,
    other_allowances NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Payroll totals
    allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
    deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,

    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (employee_id, month, year)
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_employees_role
    ON employees(role);

CREATE INDEX IF NOT EXISTS idx_employees_active
    ON employees(is_active);

CREATE INDEX IF NOT EXISTS idx_attendance_employee
    ON attendance(employee_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date
    ON attendance(work_date);

CREATE INDEX IF NOT EXISTS idx_leaves_employee
    ON leaves(employee_id);

CREATE INDEX IF NOT EXISTS idx_leaves_status
    ON leaves(status);

CREATE INDEX IF NOT EXISTS idx_payslips_employee
    ON payslips(employee_id);

CREATE INDEX IF NOT EXISTS idx_payslips_period
    ON payslips(year, month);