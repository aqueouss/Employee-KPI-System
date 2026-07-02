-- Monthly salary revisions (historical salary by effective month)

CREATE TABLE public.salary_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  effective_month date NOT NULL,
  monthly_salary numeric(12, 2) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id),
  UNIQUE (employee_id, effective_month),
  CONSTRAINT salary_revisions_non_negative CHECK (monthly_salary >= 0)
);

CREATE INDEX salary_revisions_employee_month_idx
  ON public.salary_revisions (employee_id, effective_month DESC);

ALTER TABLE public.salary_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salary_revisions_select_own_or_admin"
  ON public.salary_revisions
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "salary_revisions_admin_insert"
  ON public.salary_revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "salary_revisions_admin_update"
  ON public.salary_revisions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "salary_revisions_admin_delete"
  ON public.salary_revisions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_revisions TO authenticated;

-- Backfill from salary change audit logs (latest change per employee/month)
INSERT INTO public.salary_revisions (employee_id, effective_month, monthly_salary)
SELECT DISTINCT ON (al.entity_id, date_trunc('month', al.created_at)::date)
  al.entity_id,
  date_trunc('month', al.created_at)::date,
  (al.metadata->>'monthly_salary')::numeric
FROM public.audit_logs al
WHERE al.action = 'employee.details_updated'
  AND al.entity_id IS NOT NULL
  AND al.metadata ? 'monthly_salary'
  AND nullif(al.metadata->>'monthly_salary', '') IS NOT NULL
ORDER BY
  al.entity_id,
  date_trunc('month', al.created_at)::date,
  al.created_at DESC
ON CONFLICT (employee_id, effective_month) DO UPDATE
  SET monthly_salary = EXCLUDED.monthly_salary;
