-- Admin-defined daily tasks auto-added when attendance is present / half day / short leave.

CREATE TABLE IF NOT EXISTS public.employee_fixed_daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employee_fixed_daily_tasks_employee_idx
  ON public.employee_fixed_daily_tasks (employee_id);

DROP TRIGGER IF EXISTS employee_fixed_daily_tasks_updated_at ON public.employee_fixed_daily_tasks;
CREATE TRIGGER employee_fixed_daily_tasks_updated_at
  BEFORE UPDATE ON public.employee_fixed_daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS source_fixed_task_id uuid
  REFERENCES public.employee_fixed_daily_tasks (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tasks_employee_date_fixed_source_uidx
  ON public.tasks (employee_id, task_date, source_fixed_task_id)
  WHERE source_fixed_task_id IS NOT NULL;

ALTER TABLE public.employee_fixed_daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_fixed_daily_tasks_select" ON public.employee_fixed_daily_tasks;
CREATE POLICY "employee_fixed_daily_tasks_select"
  ON public.employee_fixed_daily_tasks
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "employee_fixed_daily_tasks_admin_insert" ON public.employee_fixed_daily_tasks;
CREATE POLICY "employee_fixed_daily_tasks_admin_insert"
  ON public.employee_fixed_daily_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "employee_fixed_daily_tasks_admin_update" ON public.employee_fixed_daily_tasks;
CREATE POLICY "employee_fixed_daily_tasks_admin_update"
  ON public.employee_fixed_daily_tasks
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "employee_fixed_daily_tasks_admin_delete" ON public.employee_fixed_daily_tasks;
CREATE POLICY "employee_fixed_daily_tasks_admin_delete"
  ON public.employee_fixed_daily_tasks
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_fixed_daily_tasks TO authenticated;
