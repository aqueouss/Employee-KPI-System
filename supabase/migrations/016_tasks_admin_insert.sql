-- Allow admins to create tasks on behalf of any employee.
DROP POLICY IF EXISTS "tasks_admin_insert" ON public.tasks;
CREATE POLICY "tasks_admin_insert"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
