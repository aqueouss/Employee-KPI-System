-- Aggregated employee KPI rankings for the leaderboard. SECURITY DEFINER so any
-- authenticated user can view rankings without exposing raw per-day snapshot
-- rows (RLS keeps individual snapshots private to the owner/admin).

CREATE OR REPLACE FUNCTION public.get_employee_rankings(p_start date, p_end date)
RETURNS TABLE (
  employee_id uuid,
  full_name text,
  avg_completion numeric,
  green_days integer,
  days_tracked integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS employee_id,
    p.full_name,
    COALESCE(ROUND(AVG(s.completion_pct), 2), 0) AS avg_completion,
    COALESCE(SUM((s.flag = 'green')::int), 0)::int AS green_days,
    COUNT(s.id)::int AS days_tracked
  FROM public.profiles p
  LEFT JOIN public.daily_kpi_snapshots s
    ON s.employee_id = p.id
   AND s.kpi_date BETWEEN p_start AND p_end
  WHERE p.role = 'employee' AND p.is_active = true
  GROUP BY p.id, p.full_name
  ORDER BY avg_completion DESC, green_days DESC, p.full_name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_employee_rankings(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_employee_rankings(date, date) TO authenticated;
