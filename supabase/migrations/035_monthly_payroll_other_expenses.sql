-- Month-level other expenses (3 line items) for payroll export sheets.

CREATE TABLE IF NOT EXISTS public.monthly_payroll_other_expenses (
  month date PRIMARY KEY,
  item_1_title text NOT NULL DEFAULT '',
  item_1_expense numeric(12, 2) NOT NULL DEFAULT 0,
  item_1_remarks text,
  item_2_title text NOT NULL DEFAULT '',
  item_2_expense numeric(12, 2) NOT NULL DEFAULT 0,
  item_2_remarks text,
  item_3_title text NOT NULL DEFAULT '',
  item_3_expense numeric(12, 2) NOT NULL DEFAULT 0,
  item_3_remarks text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id),
  CONSTRAINT monthly_payroll_other_expenses_non_negative CHECK (
    item_1_expense >= 0
    AND item_2_expense >= 0
    AND item_3_expense >= 0
  )
);

DROP TRIGGER IF EXISTS monthly_payroll_other_expenses_updated_at
  ON public.monthly_payroll_other_expenses;
CREATE TRIGGER monthly_payroll_other_expenses_updated_at
  BEFORE UPDATE ON public.monthly_payroll_other_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.monthly_payroll_other_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_payroll_other_expenses_select"
  ON public.monthly_payroll_other_expenses;
CREATE POLICY "monthly_payroll_other_expenses_select"
  ON public.monthly_payroll_other_expenses
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "monthly_payroll_other_expenses_admin_insert"
  ON public.monthly_payroll_other_expenses;
CREATE POLICY "monthly_payroll_other_expenses_admin_insert"
  ON public.monthly_payroll_other_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "monthly_payroll_other_expenses_admin_update"
  ON public.monthly_payroll_other_expenses;
CREATE POLICY "monthly_payroll_other_expenses_admin_update"
  ON public.monthly_payroll_other_expenses
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "monthly_payroll_other_expenses_admin_delete"
  ON public.monthly_payroll_other_expenses;
CREATE POLICY "monthly_payroll_other_expenses_admin_delete"
  ON public.monthly_payroll_other_expenses
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_payroll_other_expenses TO authenticated;
