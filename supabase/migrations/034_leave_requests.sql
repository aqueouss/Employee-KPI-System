-- Employee leave applications with admin approval workflow.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_type') THEN
    CREATE TYPE public.leave_request_type AS ENUM ('paid_leave', 'half_day', 'short_leave');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_status') THEN
    CREATE TYPE public.leave_request_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  leave_date date NOT NULL,
  leave_type public.leave_request_type NOT NULL,
  short_leave_type public.short_leave_type,
  reason text,
  status public.leave_request_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles (id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_requests_short_leave_type CHECK (
    (leave_type = 'short_leave' AND short_leave_type IS NOT NULL)
    OR (leave_type <> 'short_leave' AND short_leave_type IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS leave_requests_active_unique
  ON public.leave_requests (employee_id, leave_date)
  WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS leave_requests_employee_idx
  ON public.leave_requests (employee_id, leave_date DESC);

CREATE INDEX IF NOT EXISTS leave_requests_status_idx
  ON public.leave_requests (status, created_at DESC);

DROP TRIGGER IF EXISTS leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
CREATE POLICY "leave_requests_select"
  ON public.leave_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "leave_requests_owner_insert" ON public.leave_requests;
CREATE POLICY "leave_requests_owner_insert"
  ON public.leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "leave_requests_owner_delete" ON public.leave_requests;
CREATE POLICY "leave_requests_owner_delete"
  ON public.leave_requests
  FOR DELETE
  TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "leave_requests_admin_update" ON public.leave_requests;
CREATE POLICY "leave_requests_admin_update"
  ON public.leave_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, DELETE ON public.leave_requests TO authenticated;
GRANT UPDATE ON public.leave_requests TO authenticated;
