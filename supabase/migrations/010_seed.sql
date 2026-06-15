-- Seed default KPI rules

INSERT INTO public.kpi_rules (
  id,
  green_threshold,
  yellow_threshold,
  red_flags_for_warning,
  warnings_for_termination,
  termination_window_days,
  green_streak_for_reward,
  count_weekends,
  company_timezone,
  version
)
VALUES (
  1,
  90.00,
  70.00,
  3,
  3,
  365,
  30,
  true,
  'UTC',
  1
)
ON CONFLICT (id) DO NOTHING;

-- Bootstrap first admin:
-- 1. Create a user in Supabase Auth (Dashboard or CLI)
-- 2. Run the following SQL with that user's UUID:
--
-- UPDATE public.profiles
-- SET role = 'admin', full_name = 'System Admin'
-- WHERE email = 'admin@company.com';
