"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/get-session";
import {
  hasSalesAccess,
  isSalesDepartment,
  requireSalesEmployee,
} from "@/lib/sales/sales-access";
import { createClient } from "@/lib/supabase/server";
import {
  endOfMonthDateString,
  getTodayDateString,
  normalizeDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import {
  createSalesEntrySchema,
  salesEntryIdSchema,
} from "@/lib/validators/sales-entry.schema";

export type SalesActionState = {
  error?: string;
  success?: string;
};

async function getCompanyToday() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kpi_rules")
    .select("company_timezone")
    .eq("id", 1)
    .maybeSingle();
  return getTodayDateString(data?.company_timezone ?? "UTC");
}

function revalidateSalesPaths(employeeId?: string) {
  revalidatePath("/employee/sales");
  revalidatePath("/admin/sales");
  if (employeeId) {
    revalidatePath(`/admin/sales/${employeeId}`);
  }
}

function assertSaleDateInCurrentMonth(saleDate: string, today: string) {
  const monthStart = startOfMonthDateString(today);
  const monthEnd = endOfMonthDateString(today);
  if (saleDate < monthStart || saleDate > monthEnd) {
    return "Sales can only be logged for the current month.";
  }
  return null;
}

export async function createSalesEntryAction(
  _prev: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const profile = await requireSalesEmployee();
  const today = await getCompanyToday();

  const parsed = createSalesEntrySchema.safeParse({
    customer_name: formData.get("customer_name"),
    customer_phone: formData.get("customer_phone") || null,
    customer_email: formData.get("customer_email") || null,
    customer_address: formData.get("customer_address") || null,
    customer_region: formData.get("customer_region") || null,
    item_sold: formData.get("item_sold"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    total_amount: formData.get("total_amount"),
    remarks: formData.get("remarks") || null,
    sale_date: formData.get("sale_date") || today,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const saleDate = normalizeDateString(parsed.data.sale_date);
  const monthError = assertSaleDateInCurrentMonth(saleDate, today);
  if (monthError) return { error: monthError };

  const supabase = await createClient();
  const { error } = await supabase.from("sales_entries").insert({
    employee_id: profile.id,
    sale_date: saleDate,
    customer_name: parsed.data.customer_name,
    customer_phone: parsed.data.customer_phone,
    customer_email: parsed.data.customer_email,
    customer_address: parsed.data.customer_address,
    customer_region: parsed.data.customer_region,
    item_sold: parsed.data.item_sold,
    quantity: parsed.data.quantity,
    unit_price: parsed.data.unit_price,
    total_amount: parsed.data.total_amount,
    remarks: parsed.data.remarks,
  });

  if (error) return { error: error.message };

  revalidateSalesPaths(profile.id);
  return { success: "Sale recorded for this month." };
}

export async function deleteSalesEntryAction(
  _prev: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = salesEntryIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  if (profile.role === "employee") {
    if (!isSalesDepartment(profile.department)) {
      return { error: "Forbidden." };
    }

    const today = await getCompanyToday();
    const { data: entry, error: fetchError } = await supabase
      .from("sales_entries")
      .select("employee_id, sale_date")
      .eq("id", parsed.data.id)
      .single();

    if (fetchError || !entry) return { error: "Sale not found." };
    if (entry.employee_id !== profile.id) return { error: "Forbidden." };

    const monthError = assertSaleDateInCurrentMonth(entry.sale_date, today);
    if (monthError) return { error: "Only current-month sales can be removed." };
  } else if (profile.role !== "admin") {
    return { error: "Forbidden." };
  }

  const { error } = await supabase
    .from("sales_entries")
    .delete()
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidateSalesPaths(profile.role === "employee" ? profile.id : undefined);
  return { success: "Sale removed." };
}

export async function assertAdminCanViewSalesEmployee(employeeId: string) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("department, role")
    .eq("id", employeeId)
    .single();

  return Boolean(data && data.role === "employee" && isSalesDepartment(data.department));
}

export async function canAccessSales() {
  const profile = await getSessionProfile();
  return Boolean(profile && hasSalesAccess(profile));
}
