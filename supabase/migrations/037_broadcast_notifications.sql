-- Admin broadcast messages shown to employees until acknowledged.

CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.broadcast_notification_acknowledgments (
  notification_id uuid NOT NULL REFERENCES public.broadcast_notifications (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, employee_id)
);

CREATE INDEX IF NOT EXISTS broadcast_notifications_created_at_idx
  ON public.broadcast_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS broadcast_notification_ack_employee_idx
  ON public.broadcast_notification_acknowledgments (employee_id, acknowledged_at DESC);

ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notification_acknowledgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broadcast_notifications_select" ON public.broadcast_notifications;
CREATE POLICY "broadcast_notifications_select"
  ON public.broadcast_notifications
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'employee'
    )
  );

DROP POLICY IF EXISTS "broadcast_notifications_admin_insert" ON public.broadcast_notifications;
CREATE POLICY "broadcast_notifications_admin_insert"
  ON public.broadcast_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "broadcast_notification_ack_select" ON public.broadcast_notification_acknowledgments;
CREATE POLICY "broadcast_notification_ack_select"
  ON public.broadcast_notification_acknowledgments
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "broadcast_notification_ack_insert" ON public.broadcast_notification_acknowledgments;
CREATE POLICY "broadcast_notification_ack_insert"
  ON public.broadcast_notification_acknowledgments
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

GRANT SELECT, INSERT ON public.broadcast_notifications TO authenticated;
GRANT SELECT, INSERT ON public.broadcast_notification_acknowledgments TO authenticated;
