-- Sales entries for Sales department employees.

CREATE TABLE IF NOT EXISTS public.sales_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  customer_address text,
  customer_region text,
  item_sold text NOT NULL,
  quantity numeric(12, 2) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount numeric(14, 2) NOT NULL CHECK (total_amount >= 0),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_entries_employee_date_idx
  ON public.sales_entries (employee_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS sales_entries_sale_date_idx
  ON public.sales_entries (sale_date DESC);

DROP TRIGGER IF EXISTS sales_entries_updated_at ON public.sales_entries;
CREATE TRIGGER sales_entries_updated_at
  BEFORE UPDATE ON public.sales_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.sales_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_entries_select_own_or_admin" ON public.sales_entries;
CREATE POLICY "sales_entries_select_own_or_admin"
  ON public.sales_entries
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sales_entries_owner_insert" ON public.sales_entries;
CREATE POLICY "sales_entries_owner_insert"
  ON public.sales_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "sales_entries_owner_update" ON public.sales_entries;
CREATE POLICY "sales_entries_owner_update"
  ON public.sales_entries
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "sales_entries_owner_delete" ON public.sales_entries;
CREATE POLICY "sales_entries_owner_delete"
  ON public.sales_entries
  FOR DELETE
  TO authenticated
  USING (employee_id = auth.uid());

DROP POLICY IF EXISTS "sales_entries_admin_all" ON public.sales_entries;
CREATE POLICY "sales_entries_admin_all"
  ON public.sales_entries
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_entries TO authenticated;
