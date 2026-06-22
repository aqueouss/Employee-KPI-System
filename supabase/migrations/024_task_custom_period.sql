-- Custom-duration tasks: admin sets a start date (task_date) and deadline (due_date).
-- KPI scoring still uses only daily tasks.

ALTER TYPE task_period ADD VALUE IF NOT EXISTS 'custom';

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS tasks_employee_open_idx
  ON public.tasks (employee_id, status)
  WHERE status IN ('pending', 'submitted');
