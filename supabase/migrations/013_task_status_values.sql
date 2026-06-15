-- Task approval workflow: new task statuses.
-- 'submitted'  = employee marked the task done; awaiting admin approval.
-- 'rejected'   = admin rejected the submission; does NOT count toward KPI.
-- (existing) 'pending' = not done, 'completed' = admin-approved (counts toward KPI).
--
-- NOTE: enum value additions are kept in their own migration so they are not
-- used within the same transaction that creates them.

ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'rejected';
