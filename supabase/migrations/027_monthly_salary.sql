ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_salary numeric(12, 2);
