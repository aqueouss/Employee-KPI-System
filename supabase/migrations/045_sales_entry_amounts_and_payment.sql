-- Net/other amounts, auto GST, and advance payment fields for sales entries.

ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS other_amount numeric(12, 2) NOT NULL DEFAULT 0
  CHECK (other_amount >= 0);

ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS net_amount numeric(14, 2) NOT NULL DEFAULT 0
  CHECK (net_amount >= 0);

ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS is_advance_payment boolean NOT NULL DEFAULT false;

ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS advance_received numeric(14, 2)
  CHECK (advance_received IS NULL OR advance_received >= 0);

ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS remaining_amount numeric(14, 2)
  CHECK (remaining_amount IS NULL OR remaining_amount >= 0);

-- Backfill net amount for existing rows.
UPDATE public.sales_entries
SET net_amount = ROUND(quantity * unit_price, 2)
WHERE net_amount = 0;
