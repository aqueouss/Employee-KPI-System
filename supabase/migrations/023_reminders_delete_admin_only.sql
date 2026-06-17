-- Only admins may delete reminders. Employees may edit open reminders (title/details).

DROP POLICY IF EXISTS "reminders_owner_delete" ON public.reminders;

CREATE POLICY "reminders_admin_delete"
  ON public.reminders
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.enforce_reminder_employee_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF OLD.status <> 'open' THEN
      RAISE EXCEPTION 'Only open reminders can be edited.';
    END IF;
    NEW.status := OLD.status;
    NEW.resolved_by := OLD.resolved_by;
    NEW.resolved_at := OLD.resolved_at;
    NEW.resolution_note := OLD.resolution_note;
    NEW.employee_id := OLD.employee_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_reminder_employee_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reminders_employee_update_guard ON public.reminders;
CREATE TRIGGER reminders_employee_update_guard
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_reminder_employee_update();
