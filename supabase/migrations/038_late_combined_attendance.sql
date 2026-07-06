-- Late + half day / late + short leave combined attendance statuses

ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'late_half_day';
ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'late_short_leave';
