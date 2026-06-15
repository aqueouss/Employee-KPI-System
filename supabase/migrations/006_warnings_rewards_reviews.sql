-- Warnings, rewards, termination reviews

CREATE TABLE public.warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  warning_month date NOT NULL,
  red_flag_dates date[] NOT NULL,
  reason text NOT NULL DEFAULT 'Three red KPI flags in one calendar month.',
  status warning_status NOT NULL DEFAULT 'active',
  issued_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  UNIQUE (employee_id, warning_month)
);

CREATE INDEX warnings_employee_issued_idx
  ON public.warnings (employee_id, issued_at DESC);

CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  streak_start_date date NOT NULL,
  streak_end_date date NOT NULL,
  status reward_status NOT NULL DEFAULT 'eligible',
  eligible_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz,
  issued_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes text
);

CREATE INDEX rewards_employee_status_idx
  ON public.rewards (employee_id, status);

CREATE INDEX rewards_eligible_idx
  ON public.rewards (status)
  WHERE status = 'eligible';

CREATE TABLE public.termination_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  warning_ids uuid[] NOT NULL,
  status review_status NOT NULL DEFAULT 'eligible',
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  resolution_notes text
);

CREATE INDEX termination_reviews_employee_idx
  ON public.termination_reviews (employee_id, triggered_at DESC);
