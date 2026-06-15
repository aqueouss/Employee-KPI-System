-- KPI rules (singleton configuration)

CREATE TABLE public.kpi_rules (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  green_threshold numeric(5, 2) NOT NULL DEFAULT 90.00
    CHECK (green_threshold > 0 AND green_threshold <= 100),
  yellow_threshold numeric(5, 2) NOT NULL DEFAULT 70.00
    CHECK (yellow_threshold > 0 AND yellow_threshold <= 100),
  red_flags_for_warning integer NOT NULL DEFAULT 3 CHECK (red_flags_for_warning > 0),
  warnings_for_termination integer NOT NULL DEFAULT 3 CHECK (warnings_for_termination > 0),
  termination_window_days integer NOT NULL DEFAULT 365 CHECK (termination_window_days > 0),
  green_streak_for_reward integer NOT NULL DEFAULT 30 CHECK (green_streak_for_reward > 0),
  count_weekends boolean NOT NULL DEFAULT true,
  company_timezone text NOT NULL DEFAULT 'UTC',
  version integer NOT NULL DEFAULT 1,
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER kpi_rules_updated_at
  BEFORE UPDATE ON public.kpi_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
