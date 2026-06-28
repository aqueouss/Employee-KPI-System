-- Monthly payroll adjustments (incentives, conveyance, advance deduction)

CREATE TABLE public.monthly_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month date NOT NULL,
  incentives numeric(12, 2) NOT NULL DEFAULT 0,
  conveyance numeric(12, 2) NOT NULL DEFAULT 0,
  advance_deduction numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id),
  UNIQUE (employee_id, month),
  CONSTRAINT monthly_payroll_non_negative CHECK (
    incentives >= 0
    AND conveyance >= 0
    AND advance_deduction >= 0
  )
);

CREATE INDEX monthly_payroll_employee_month_idx
  ON public.monthly_payroll (employee_id, month DESC);

ALTER TABLE public.monthly_payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_payroll_select_own_or_admin"
  ON public.monthly_payroll
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "monthly_payroll_admin_insert"
  ON public.monthly_payroll
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "monthly_payroll_admin_update"
  ON public.monthly_payroll
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "monthly_payroll_admin_delete"
  ON public.monthly_payroll
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_payroll TO authenticated;
