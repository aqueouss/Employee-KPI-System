-- Order date, GST, and status fields for sales entries.

ALTER TABLE public.sales_entries
  RENAME COLUMN sale_date TO order_date;

ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS gst_amount numeric(12, 2) NOT NULL DEFAULT 0
  CHECK (gst_amount >= 0);

ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS order_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS dispatch_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.sales_entries
  DROP COLUMN IF EXISTS remarks;

DROP INDEX IF EXISTS public.sales_entries_employee_date_idx;
CREATE INDEX IF NOT EXISTS sales_entries_employee_date_idx
  ON public.sales_entries (employee_id, order_date DESC);

DROP INDEX IF EXISTS public.sales_entries_sale_date_idx;
CREATE INDEX IF NOT EXISTS sales_entries_order_date_idx
  ON public.sales_entries (order_date DESC);
