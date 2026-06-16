-- Notifications: track admin-created tasks the employee hasn't seen yet so we
-- can show an unread badge on the employee dashboard / tasks views.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seen_by_employee boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS tasks_employee_unseen_idx
  ON public.tasks (employee_id)
  WHERE created_by_admin AND NOT seen_by_employee;
