-- Domain helper functions for KPI calculations (used by cron in later phases)

CREATE OR REPLACE FUNCTION public.determine_kpi_flag(
  p_completion_pct numeric,
  p_total_tasks integer,
  p_green_threshold numeric,
  p_yellow_threshold numeric
)
RETURNS kpi_flag
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_total_tasks = 0 THEN
    RETURN 'no_tasks';
  END IF;

  IF p_completion_pct >= p_green_threshold THEN
    RETURN 'green';
  END IF;

  IF p_completion_pct >= p_yellow_threshold THEN
    RETURN 'yellow';
  END IF;

  RETURN 'red';
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_completion_pct(
  p_employee_id uuid,
  p_kpi_date date
)
RETURNS TABLE (
  total_tasks integer,
  completed_tasks integer,
  completion_pct numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::integer AS total_tasks,
    COUNT(*) FILTER (WHERE status = 'completed')::integer AS completed_tasks,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric) * 100,
        2
      )
    END AS completion_pct
  FROM public.tasks
  WHERE employee_id = p_employee_id
    AND task_date = p_kpi_date;
$$;

GRANT EXECUTE ON FUNCTION public.determine_kpi_flag(numeric, integer, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_completion_pct(uuid, date) TO authenticated;
