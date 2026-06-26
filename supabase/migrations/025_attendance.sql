-- Attendance & leave balance (office 10am–6pm, Sun closed)

CREATE TYPE public.attendance_status AS ENUM (
  'present',
  'late',
  'paid_leave',
  'half_day',
  'short_leave',
  'absent',
  'sunday_leave'
);

CREATE TYPE public.short_leave_type AS ENUM (
  'late_arrival',
  'early_departure'
);

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status public.attendance_status NOT NULL,
  short_leave_type public.short_leave_type,
  notes text,
  is_auto_generated boolean NOT NULL DEFAULT false,
  marked_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, attendance_date),
  CONSTRAINT short_leave_type_required CHECK (
    (status = 'short_leave' AND short_leave_type IS NOT NULL)
    OR (status <> 'short_leave' AND short_leave_type IS NULL)
  )
);

CREATE TABLE public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month date NOT NULL,
  paid_leave_allowance numeric(4, 1) NOT NULL DEFAULT 1,
  half_day_allowance numeric(4, 1) NOT NULL DEFAULT 1,
  short_leave_allowance numeric(4, 1) NOT NULL DEFAULT 1,
  late_allowance integer NOT NULL DEFAULT 4,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id),
  UNIQUE (employee_id, month)
);

CREATE INDEX attendance_records_employee_date_idx
  ON public.attendance_records (employee_id, attendance_date DESC);

CREATE INDEX leave_balances_employee_month_idx
  ON public.leave_balances (employee_id, month DESC);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select_own_or_admin"
  ON public.attendance_records
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "attendance_admin_insert"
  ON public.attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "attendance_admin_update"
  ON public.attendance_records
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "attendance_admin_delete"
  ON public.attendance_records
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "leave_balances_select_own_or_admin"
  ON public.leave_balances
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "leave_balances_admin_insert"
  ON public.leave_balances
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "leave_balances_admin_update"
  ON public.leave_balances
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "leave_balances_admin_delete"
  ON public.leave_balances
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_balances TO authenticated;
