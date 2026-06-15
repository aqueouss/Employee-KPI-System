-- RLS helper functions

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- Enable RLS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termination_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own_non_role_fields"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_admin_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Tasks policies

CREATE POLICY "tasks_select_own_or_admin"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "tasks_insert_own"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "tasks_update_own"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "tasks_delete_own"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (employee_id = auth.uid());

-- Daily KPI snapshots policies

CREATE POLICY "kpi_snapshots_select_own_or_admin"
  ON public.daily_kpi_snapshots
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

-- KPI rules policies

CREATE POLICY "kpi_rules_select_authenticated"
  ON public.kpi_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "kpi_rules_admin_update"
  ON public.kpi_rules
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Warnings policies

CREATE POLICY "warnings_select_own_or_admin"
  ON public.warnings
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "warnings_admin_update"
  ON public.warnings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Rewards policies

CREATE POLICY "rewards_select_own_or_admin"
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "rewards_admin_update"
  ON public.rewards
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Termination reviews policies

CREATE POLICY "termination_reviews_select_own_or_admin"
  ON public.termination_reviews
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "termination_reviews_admin_all"
  ON public.termination_reviews
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Audit logs policies

CREATE POLICY "audit_logs_admin_select"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "audit_logs_authenticated_insert"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_admin());
