-- Admin-managed employee fields: hire date and job designation.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hire_date date,
  ADD COLUMN IF NOT EXISTS job_designation text;
