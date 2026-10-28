-- Finance & Payroll Dashboard initial schema.
-- Run against the dedicated hani-model-1 database only.
-- This migration creates application tables; it does not modify existing databases.

BEGIN;

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  monthly_budget NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (monthly_budget >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  employee_code VARCHAR(40) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(40),
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
  position VARCHAR(120) NOT NULL,
  hire_date DATE,
  base_salary NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
  employment_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (employment_status IN ('active', 'on_leave', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);

CREATE TABLE IF NOT EXISTS payroll_periods (
  id BIGSERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end >= period_start),
  UNIQUE (period_start, period_end)
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id BIGSERIAL PRIMARY KEY,
  payroll_period_id BIGINT NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  base_salary NUMERIC(14, 2) NOT NULL CHECK (base_salary >= 0),
  bonuses NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (bonuses >= 0),
  deductions NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net_salary NUMERIC(14, 2) GENERATED ALWAYS AS (base_salary + bonuses - deductions) STORED,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payroll_period_id, employee_id),
  CHECK (deductions <= base_salary + bonuses)
);

CREATE INDEX IF NOT EXISTS idx_payroll_items_period ON payroll_items(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  merchant VARCHAR(180) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'needs_receipt'
    CHECK (status IN ('pending', 'complete', 'needs_receipt')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE TABLE IF NOT EXISTS company_cards (
  id BIGSERIAL PRIMARY KEY,
  card_label VARCHAR(100) NOT NULL,
  cardholder_name VARCHAR(200) NOT NULL,
  last_four CHAR(4) NOT NULL CHECK (last_four ~ '^[0-9]{4}$'),
  spending_limit NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (spending_limit >= 0),
  current_spend NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (current_spend >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id BIGSERIAL PRIMARY KEY,
  department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (department_id, month_start),
  CHECK (EXTRACT(DAY FROM month_start) = 1)
);

CREATE TABLE IF NOT EXISTS dues (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dues_due_date ON dues(due_date);
CREATE INDEX IF NOT EXISTS idx_dues_status ON dues(status);

COMMIT;