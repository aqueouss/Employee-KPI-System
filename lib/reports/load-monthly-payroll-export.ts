import { loadMonthAttendance } from "@/lib/attendance/month-data";
import { formatMonthLabel } from "@/lib/payroll/format-month-label";
import {
  otherExpensesTotal,
  payrollOtherExpensesFromRow,
  type PayrollOtherExpenseItem,
} from "@/lib/payroll/other-expenses";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthDateString } from "@/lib/utils/dates";
import type { Tables } from "@/types/database.types";

export type MonthlyPayrollExportRow = {
  serial: number;
  name: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  fixedSalary: number | null;
  daysWorked: number;
  totalAmount: number | null;
  conveyance: number;
  overtime: number;
  incentives: number;
  advanceDeduction: number;
  advancePending: number;
  previousBalance: number;
  netPayable: number | null;
  remark: string;
};

export type MonthlyPayrollExport = {
  monthStart: string;
  monthLabel: string;
  rows: MonthlyPayrollExportRow[];
  otherExpenses: PayrollOtherExpenseItem[];
  otherExpensesTotal: number;
  totals: {
    fixedSalary: number;
    daysWorked: number;
    totalAmount: number;
    conveyance: number;
    overtime: number;
    incentives: number;
    advanceDeduction: number;
    advancePending: number;
    previousBalance: number;
    netPayable: number;
  };
};

export async function loadMonthlyPayrollExport(
  month: string,
): Promise<MonthlyPayrollExport> {
  const monthStart = startOfMonthDateString(month);
  const supabase = await createClient();

  const { data: otherExpensesRow } = await supabase
    .from("monthly_payroll_other_expenses")
    .select("*")
    .eq("month", monthStart)
    .maybeSingle();

  const otherExpenses = payrollOtherExpensesFromRow(otherExpensesRow);

  const { data: employees } = await supabase
    .from("profiles")
    .select(
      "id, full_name, bank_account_holder, bank_name, bank_account_number, bank_ifsc",
    )
    .eq("role", "employee")
    .eq("is_active", true)
    .order("full_name");

  const list = (employees ?? []) as Pick<
    Tables<"profiles">,
    | "id"
    | "full_name"
    | "bank_account_holder"
    | "bank_name"
    | "bank_account_number"
    | "bank_ifsc"
  >[];
  const rows: MonthlyPayrollExportRow[] = [];

  for (const [index, employee] of list.entries()) {
    const { payrollSummary, payrollRow } = await loadMonthAttendance(
      employee.id,
      monthStart,
    );

    rows.push({
      serial: index + 1,
      name: employee.full_name,
      accountHolderName: employee.bank_account_holder?.trim() ?? "",
      bankName: employee.bank_name?.trim() ?? "",
      accountNumber: employee.bank_account_number?.trim() ?? "",
      ifscCode: employee.bank_ifsc?.trim() ?? "",
      fixedSalary: payrollSummary.monthly_salary,
      daysWorked: payrollSummary.salaried_days,
      totalAmount: payrollSummary.calculated_salary,
      conveyance: payrollSummary.conveyance,
      overtime: 0,
      incentives: payrollSummary.incentives,
      advanceDeduction: payrollSummary.advance_deduction,
      advancePending: 0,
      previousBalance: 0,
      netPayable: payrollSummary.net_salary,
      remark: payrollRow?.notes?.trim() ?? "",
    });
  }

  const totals = rows.reduce(
    (acc, row) => ({
      fixedSalary: acc.fixedSalary + (row.fixedSalary ?? 0),
      daysWorked: acc.daysWorked + row.daysWorked,
      totalAmount: acc.totalAmount + (row.totalAmount ?? 0),
      conveyance: acc.conveyance + row.conveyance,
      overtime: acc.overtime + row.overtime,
      incentives: acc.incentives + row.incentives,
      advanceDeduction: acc.advanceDeduction + row.advanceDeduction,
      advancePending: acc.advancePending + row.advancePending,
      previousBalance: acc.previousBalance + row.previousBalance,
      netPayable: acc.netPayable + (row.netPayable ?? 0),
    }),
    {
      fixedSalary: 0,
      daysWorked: 0,
      totalAmount: 0,
      conveyance: 0,
      overtime: 0,
      incentives: 0,
      advanceDeduction: 0,
      advancePending: 0,
      previousBalance: 0,
      netPayable: 0,
    },
  );

  const otherExpensesTotalAmount = otherExpensesTotal(otherExpenses);

  return {
    monthStart,
    monthLabel: formatMonthLabel(monthStart).toUpperCase(),
    rows,
    otherExpenses,
    otherExpensesTotal: otherExpensesTotalAmount,
    totals: {
      ...totals,
      netPayable:
        Math.round((totals.netPayable + otherExpensesTotalAmount) * 100) / 100,
    },
  };
}
