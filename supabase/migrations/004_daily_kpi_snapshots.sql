-- Daily KPI snapshots

CREATE TABLE public.daily_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  kpi_date date NOT NULL,
  total_tasks integer NOT NULL CHECK (total_tasks >= 0),
  completed_tasks integer NOT NULL CHECK (completed_tasks >= 0),
  completion_pct numeric(5, 2) NOT NULL CHECK (completion_pct >= 0 AND completion_pct <= 100),
  flag kpi_flag NOT NULL,
  rules_version integer NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, kpi_date)
);

CREATE INDEX daily_kpi_snapshots_employee_date_idx
  ON public.daily_kpi_snapshots (employee_id, kpi_date DESC);

CREATE INDEX daily_kpi_snapshots_flag_idx
  ON public.daily_kpi_snapshots (flag);
