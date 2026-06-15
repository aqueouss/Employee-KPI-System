-- Security hardening (addresses Supabase database linter warnings)

-- Pin search_path on functions that were missing it
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.determine_kpi_flag(
  p_completion_pct numeric,
  p_total_tasks integer,
  p_green_threshold numeric,
  p_yellow_threshold numeric
)
RETURNS kpi_flag
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
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

-- Trigger functions must never be callable via PostgREST RPC
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Engine helpers are server-side only (service role bypasses grants)
REVOKE ALL ON FUNCTION public.determine_kpi_flag(numeric, integer, numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_completion_pct(uuid, date) FROM PUBLIC, anon, authenticated;

-- RLS helpers: drop anon access, keep authenticated (required by policy evaluation)
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;
