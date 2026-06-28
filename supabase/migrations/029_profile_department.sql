-- Employee department for payslips, KPI grouping, and admin views.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department text;

CREATE INDEX IF NOT EXISTS profiles_department_idx ON public.profiles (department);
