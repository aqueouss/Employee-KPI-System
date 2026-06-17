-- Reusable daily task templates ("suggestions") an employee can add to today's
-- list in one click. Max 5 per employee is enforced in the server action.

CREATE TABLE IF NOT EXISTS public.task_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_suggestions_employee_idx
  ON public.task_suggestions (employee_id);

DROP TRIGGER IF EXISTS task_suggestions_updated_at ON public.task_suggestions;
CREATE TRIGGER task_suggestions_updated_at
  BEFORE UPDATE ON public.task_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.task_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_suggestions_owner_select" ON public.task_suggestions;
CREATE POLICY "task_suggestions_owner_select"
  ON public.task_suggestions
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "task_suggestions_owner_insert" ON public.task_suggestions;
CREATE POLICY "task_suggestions_owner_insert"
  ON public.task_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "task_suggestions_owner_update" ON public.task_suggestions;
CREATE POLICY "task_suggestions_owner_update"
  ON public.task_suggestions
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "task_suggestions_owner_delete" ON public.task_suggestions;
CREATE POLICY "task_suggestions_owner_delete"
  ON public.task_suggestions
  FOR DELETE
  TO authenticated
  USING (employee_id = auth.uid());
