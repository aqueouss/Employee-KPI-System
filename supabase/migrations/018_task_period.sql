-- Support weekly/monthly/quarterly tasks alongside daily ones. task_date holds
-- the period start (Monday for weekly, 1st of month, 1st day of quarter).
-- KPI scoring continues to use only daily tasks.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_period') THEN
    CREATE TYPE task_period AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');
  END IF;
END $$;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS period task_period NOT NULL DEFAULT 'daily';

CREATE INDEX IF NOT EXISTS tasks_employee_period_date_idx
  ON public.tasks (employee_id, period, task_date);
