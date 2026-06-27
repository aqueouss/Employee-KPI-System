-- Overtime hours (8h shift) convert to paid leave at month end

ALTER TABLE public.leave_balances
  ADD COLUMN IF NOT EXISTS overtime_hours numeric(6, 1) NOT NULL DEFAULT 0;
