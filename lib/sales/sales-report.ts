import type { SupabaseClient } from "@supabase/supabase-js";

import {
  endOfMonthDateString,
  endOfQuarterDateString,
  getTodayDateString,
  startOfMonthDateString,
  startOfQuarterDateString,
} from "@/lib/utils/dates";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type SalesReportPeriod =
  | "monthly"
  | "quarterly"
  | "half_yearly"
  | "yearly"
  | "all_time";

export type SalesEntryRow = {
  id: string;
  order_date: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_region: string | null;
  item_sold: string;
  quantity: number;
  unit_price: number;
  gst_amount: number;
  total_amount: number;
  order_status: string;
  dispatch_status: string;
  created_at: string;
};

export type SalesReportSummary = {
  period: SalesReportPeriod;
  label: string;
  startDate: string;
  endDate: string;
  entryCount: number;
  totalQuantity: number;
  totalAmount: number;
};

export type SalesReportData = {
  entries: SalesEntryRow[];
  summary: SalesReportSummary;
};

function startOfHalfYearDateString(value: string): string {
  const month = Number(value.slice(5, 7));
  const halfStartMonth = month <= 6 ? 1 : 7;
  return `${value.slice(0, 4)}-${String(halfStartMonth).padStart(2, "0")}-01`;
}

function endOfHalfYearDateString(value: string): string {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  if (month <= 6) {
    return `${value.slice(0, 4)}-06-30`;
  }
  return `${year}-12-31`;
}

function startOfYearDateString(value: string): string {
  return `${value.slice(0, 4)}-01-01`;
}

function endOfYearDateString(value: string): string {
  return `${value.slice(0, 4)}-12-31`;
}

export function resolveSalesPeriodRange(
  period: SalesReportPeriod,
  anchorDate: string,
  hireDate?: string | null,
): { startDate: string; endDate: string; label: string } {
  const today = getTodayDateString();
  const anchor = anchorDate.slice(0, 10);

  switch (period) {
    case "monthly": {
      const startDate = startOfMonthDateString(anchor);
      const endDate = endOfMonthDateString(anchor);
      return {
        startDate,
        endDate,
        label: new Date(`${startDate}T12:00:00`).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        }),
      };
    }
    case "quarterly": {
      const startDate = startOfQuarterDateString(anchor);
      const endDate = endOfQuarterDateString(anchor);
      const quarter = Math.floor((Number(anchor.slice(5, 7)) - 1) / 3) + 1;
      return {
        startDate,
        endDate,
        label: `Q${quarter} ${anchor.slice(0, 4)}`,
      };
    }
    case "half_yearly": {
      const startDate = startOfHalfYearDateString(anchor);
      const endDate = endOfHalfYearDateString(anchor);
      const half = Number(anchor.slice(5, 7)) <= 6 ? "H1" : "H2";
      return {
        startDate,
        endDate,
        label: `${half} ${anchor.slice(0, 4)}`,
      };
    }
    case "yearly": {
      const startDate = startOfYearDateString(anchor);
      const endDate = endOfYearDateString(anchor);
      return {
        startDate,
        endDate,
        label: anchor.slice(0, 4),
      };
    }
    case "all_time": {
      const startDate = hireDate?.slice(0, 10) ?? "1970-01-01";
      return {
        startDate,
        endDate: today,
        label: "Since joining",
      };
    }
  }
}

function mapEntry(row: Database["public"]["Tables"]["sales_entries"]["Row"]): SalesEntryRow {
  return {
    id: row.id,
    order_date: row.order_date,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email,
    customer_address: row.customer_address,
    customer_region: row.customer_region,
    item_sold: row.item_sold,
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    gst_amount: Number(row.gst_amount),
    total_amount: Number(row.total_amount),
    order_status: row.order_status,
    dispatch_status: row.dispatch_status,
    created_at: row.created_at,
  };
}

export async function loadSalesReport(
  client: Client,
  employeeId: string,
  period: SalesReportPeriod,
  anchorDate: string,
  hireDate?: string | null,
): Promise<SalesReportData> {
  const range = resolveSalesPeriodRange(period, anchorDate, hireDate);

  const { data, error } = await client
    .from("sales_entries")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("order_date", range.startDate)
    .lte("order_date", range.endDate)
    .order("order_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const entries = (data ?? []).map(mapEntry);
  const totalQuantity = entries.reduce((sum, row) => sum + row.quantity, 0);
  const totalAmount = entries.reduce((sum, row) => sum + row.total_amount, 0);

  return {
    entries,
    summary: {
      period,
      label: range.label,
      startDate: range.startDate,
      endDate: range.endDate,
      entryCount: entries.length,
      totalQuantity,
      totalAmount,
    },
  };
}

export function formatSalesCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}
