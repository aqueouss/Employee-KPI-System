-- Allow short_leave_type on late + short leave records

ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS short_leave_type_required;

ALTER TABLE public.attendance_records
  ADD CONSTRAINT short_leave_type_required CHECK (
    (status IN ('short_leave', 'late_short_leave') AND short_leave_type IS NOT NULL)
    OR (status NOT IN ('short_leave', 'late_short_leave') AND short_leave_type IS NULL)
  );
