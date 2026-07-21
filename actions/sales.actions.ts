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
} from "@/lib/utils/dates";
import {
  createSalesEntrySchema,
  resolveSalesPaymentFields,
  salesEntryIdSchema,
  updateSalesEntrySchema,
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

function assertOrderDateAllowed(
  orderDate: string,
  today: string,
  hireDate?: string | null,
) {
  const monthEnd = endOfMonthDateString(today);
  if (orderDate > monthEnd) {
    return "Orders cannot be logged for future months.";
  }
  const joined = hireDate?.slice(0, 10);
  if (joined && orderDate < joined) {
    return "Order date cannot be before your joining date.";
  }
  return null;
}

function parseSalesEntryFormData(formData: FormData, includeId = false) {
  const isAdvance = formData.get("is_advance_payment") === "true";

  return {
    ...(includeId ? { id: formData.get("id") } : {}),
    customer_name: formData.get("customer_name"),
    customer_phone: formData.get("customer_phone") || null,
    customer_email: formData.get("customer_email") || null,
    customer_address: formData.get("customer_address") || null,
    customer_region: formData.get("customer_region") || null,
    item_sold: formData.get("item_sold"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    other_amount: formData.get("other_amount"),
    net_amount: formData.get("net_amount"),
    gst_amount: formData.get("gst_amount"),
    total_amount: formData.get("total_amount"),
    is_advance_payment: formData.get("is_advance_payment"),
    advance_received: isAdvance ? formData.get("advance_received") : null,
    remaining_amount: isAdvance ? formData.get("remaining_amount") : null,
    order_status: formData.get("order_status"),
    dispatch_status: formData.get("dispatch_status"),
    order_date: formData.get("order_date"),
  };
}

function buildSalesEntryRecord(
  parsed: ReturnType<typeof createSalesEntrySchema.parse>,
) {
  const payment = resolveSalesPaymentFields(parsed);

  return {
    customer_name: parsed.customer_name,
    customer_phone: parsed.customer_phone,
    customer_email: parsed.customer_email,
    customer_address: parsed.customer_address,
    customer_region: parsed.customer_region,
    item_sold: parsed.item_sold,
    quantity: parsed.quantity,
    unit_price: parsed.unit_price,
    other_amount: parsed.other_amount,
    net_amount: parsed.net_amount,
    gst_amount: parsed.gst_amount,
    total_amount: parsed.total_amount,
    order_status: parsed.order_status,
    dispatch_status: parsed.dispatch_status,
    ...payment,
  };
}

export async function createSalesEntryAction(
  _prev: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const profile = await requireSalesEmployee();
  const today = await getCompanyToday();

  const parsed = createSalesEntrySchema.safeParse(parseSalesEntryFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const orderDate = normalizeDateString(parsed.data.order_date || today);
  const dateError = assertOrderDateAllowed(orderDate, today, profile.hire_date);
  if (dateError) return { error: dateError };

  const supabase = await createClient();
  const { error } = await supabase.from("sales_entries").insert({
    employee_id: profile.id,
    order_date: orderDate,
    ...buildSalesEntryRecord(parsed.data),
  });

  if (error) return { error: error.message };

  revalidateSalesPaths(profile.id);
  return { success: "Sale recorded." };
}

export async function updateSalesEntryAction(
  _prev: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Not authenticated." };

  const parsed = updateSalesEntrySchema.safeParse(
    parseSalesEntryFormData(formData, true),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: entry, error: fetchError } = await supabase
    .from("sales_entries")
    .select("employee_id")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !entry) return { error: "Sale not found." };

  let hireDate: string | null = null;
  const today = await getCompanyToday();

  if (profile.role === "employee") {
    if (!isSalesDepartment(profile.department)) {
      return { error: "Forbidden." };
    }
    if (entry.employee_id !== profile.id) return { error: "Forbidden." };
    hireDate = profile.hire_date;
  } else if (profile.role === "admin") {
    const { data: owner } = await supabase
      .from("profiles")
      .select("department, role, hire_date")
      .eq("id", entry.employee_id)
      .single();

    if (
      !owner ||
      owner.role !== "employee" ||
      !isSalesDepartment(owner.department)
    ) {
      return { error: "Forbidden." };
    }
    hireDate = owner.hire_date;
  } else {
    return { error: "Forbidden." };
  }

  const orderDate = normalizeDateString(parsed.data.order_date);
  const dateError = assertOrderDateAllowed(orderDate, today, hireDate);
  if (dateError) return { error: dateError };

  const { error } = await supabase
    .from("sales_entries")
    .update({
      order_date: orderDate,
      ...buildSalesEntryRecord(parsed.data),
    })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidateSalesPaths(entry.employee_id);
  return { success: "Sale updated." };
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
  let employeeIdForRevalidate: string | undefined;

  if (profile.role === "employee") {
    if (!isSalesDepartment(profile.department)) {
      return { error: "Forbidden." };
    }

    const today = await getCompanyToday();
    const { data: entry, error: fetchError } = await supabase
      .from("sales_entries")
      .select("employee_id, order_date")
      .eq("id", parsed.data.id)
      .single();

    if (fetchError || !entry) return { error: "Sale not found." };
    if (entry.employee_id !== profile.id) return { error: "Forbidden." };

    const dateError = assertOrderDateAllowed(entry.order_date, today, profile.hire_date);
    if (dateError) return { error: "Future-month sales cannot be removed." };
    employeeIdForRevalidate = profile.id;
  } else if (profile.role === "admin") {
    const { data: entry } = await supabase
      .from("sales_entries")
      .select("employee_id")
      .eq("id", parsed.data.id)
      .single();
    employeeIdForRevalidate = entry?.employee_id;
  } else {
    return { error: "Forbidden." };
  }

  const { error } = await supabase
    .from("sales_entries")
    .delete()
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidateSalesPaths(employeeIdForRevalidate);
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
