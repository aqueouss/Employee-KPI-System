-- Task approval workflow: review metadata, admin RLS, and a status-transition
-- guard so employees cannot self-approve their tasks.

-- 1. Review metadata columns
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles (id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text;

CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);

-- 2. Allow admins to update any task (needed to approve/reject).
DROP POLICY IF EXISTS "tasks_admin_update" ON public.tasks;
CREATE POLICY "tasks_admin_update"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Guard: only admins may move a task into 'completed' or 'rejected', and
--    only admins may set review metadata. Enforced at the DB level so it holds
--    even if the API is bypassed.
CREATE OR REPLACE FUNCTION public.enforce_task_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.status IN ('completed', 'rejected')
       AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only an admin can approve or reject tasks.';
    END IF;

    -- Non-admins cannot write review metadata.
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.review_note := OLD.review_note;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_task_status_transition() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tasks_status_guard ON public.tasks;
CREATE TRIGGER tasks_status_guard
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_task_status_transition();
