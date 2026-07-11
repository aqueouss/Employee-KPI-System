-- Funny attendance greetings shown on employee dashboard + browser notifications.

CREATE TABLE IF NOT EXISTS public.attendance_mark_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status public.attendance_status NOT NULL,
  message text NOT NULL,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS attendance_mark_notifications_employee_date_idx
  ON public.attendance_mark_notifications (employee_id, attendance_date DESC);

DROP TRIGGER IF EXISTS attendance_mark_notifications_updated_at ON public.attendance_mark_notifications;
CREATE TRIGGER attendance_mark_notifications_updated_at
  BEFORE UPDATE ON public.attendance_mark_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.attendance_mark_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_mark_notifications_employee_select" ON public.attendance_mark_notifications;
CREATE POLICY "attendance_mark_notifications_employee_select"
  ON public.attendance_mark_notifications
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "attendance_mark_notifications_admin_insert" ON public.attendance_mark_notifications;
CREATE POLICY "attendance_mark_notifications_admin_insert"
  ON public.attendance_mark_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "attendance_mark_notifications_admin_update" ON public.attendance_mark_notifications;
CREATE POLICY "attendance_mark_notifications_admin_update"
  ON public.attendance_mark_notifications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "attendance_mark_notifications_employee_seen" ON public.attendance_mark_notifications;
CREATE POLICY "attendance_mark_notifications_employee_seen"
  ON public.attendance_mark_notifications
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.attendance_mark_notifications TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'attendance_mark_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_mark_notifications;
  END IF;
END $$;
