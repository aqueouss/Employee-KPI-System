-- Allow admins to delete any employee's task, including approved (completed)
-- ones. Employees remain limited to deleting their own non-approved tasks
-- (enforced by the tasks_delete_own policy + the deleteTaskAction guard).

DROP POLICY IF EXISTS "tasks_admin_delete" ON public.tasks;
CREATE POLICY "tasks_admin_delete"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
