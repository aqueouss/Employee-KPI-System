-- Reminders / Blockers: items employees raise to the admin. Employees manage
-- their own; admins can see all and resolve them.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
    CREATE TYPE reminder_status AS ENUM ('open', 'resolved');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  details text,
  status reminder_status NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES public.profiles (id),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminders_employee_idx ON public.reminders (employee_id);
CREATE INDEX IF NOT EXISTS reminders_status_idx ON public.reminders (status);

DROP TRIGGER IF EXISTS reminders_updated_at ON public.reminders;
CREATE TRIGGER reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_select" ON public.reminders;
CREATE POLICY "reminders_select"
  ON public.reminders
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reminders_owner_insert" ON public.reminders;
CREATE POLICY "reminders_owner_insert"
  ON public.reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "reminders_owner_update" ON public.reminders;
CREATE POLICY "reminders_owner_update"
  ON public.reminders
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "reminders_admin_update" ON public.reminders;
CREATE POLICY "reminders_admin_update"
  ON public.reminders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reminders_owner_delete" ON public.reminders;
CREATE POLICY "reminders_owner_delete"
  ON public.reminders
  FOR DELETE
  TO authenticated
  USING (employee_id = auth.uid());
