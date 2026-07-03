-- Store other payroll expenses as a variable-length JSON array per month.

ALTER TABLE public.monthly_payroll_other_expenses
  ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.monthly_payroll_other_expenses
SET items = COALESCE(
  (
    SELECT jsonb_agg(entry ORDER BY ord)
    FROM (
      SELECT
        1 AS ord,
        jsonb_build_object(
          'title', item_1_title,
          'expense', item_1_expense,
          'remarks', COALESCE(item_1_remarks, '')
        ) AS entry
      WHERE item_1_title <> '' OR item_1_expense > 0
      UNION ALL
      SELECT
        2 AS ord,
        jsonb_build_object(
          'title', item_2_title,
          'expense', item_2_expense,
          'remarks', COALESCE(item_2_remarks, '')
        ) AS entry
      WHERE item_2_title <> '' OR item_2_expense > 0
      UNION ALL
      SELECT
        3 AS ord,
        jsonb_build_object(
          'title', item_3_title,
          'expense', item_3_expense,
          'remarks', COALESCE(item_3_remarks, '')
        ) AS entry
      WHERE item_3_title <> '' OR item_3_expense > 0
    ) migrated
  ),
  '[]'::jsonb
);

ALTER TABLE public.monthly_payroll_other_expenses
  DROP CONSTRAINT IF EXISTS monthly_payroll_other_expenses_non_negative;

ALTER TABLE public.monthly_payroll_other_expenses
  DROP COLUMN IF EXISTS item_1_title,
  DROP COLUMN IF EXISTS item_1_expense,
  DROP COLUMN IF EXISTS item_1_remarks,
  DROP COLUMN IF EXISTS item_2_title,
  DROP COLUMN IF EXISTS item_2_expense,
  DROP COLUMN IF EXISTS item_2_remarks,
  DROP COLUMN IF EXISTS item_3_title,
  DROP COLUMN IF EXISTS item_3_expense,
  DROP COLUMN IF EXISTS item_3_remarks;
