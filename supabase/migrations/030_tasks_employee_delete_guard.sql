-- Employees may only delete their own pending tasks that they created themselves.
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;
CREATE POLICY "tasks_delete_own"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    employee_id = (SELECT auth.uid())
    AND status = 'pending'
    AND NOT created_by_admin
  );
