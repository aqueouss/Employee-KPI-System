import { loadMonthAttendance } from "@/lib/attendance/month-data";
import {
  groupEmployeesByDepartment,
  type DepartmentEmployee,
} from "@/lib/departments/department-utils";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthDateString } from "@/lib/utils/dates";
import type { PayrollSummary } from "@/services/attendance/attendance.engine";

export function employeePayrollExpense(payroll: PayrollSummary): number | null {
  const attendance = payroll.calculated_salary;
  const net = payroll.net_salary;
  if (attendance === null && net === null) return null;
  return Math.round(Math.max(attendance ?? 0, net ?? 0) * 100) / 100;
}

export type EmployeePayrollRow = {
  employee: DepartmentEmployee;
  payroll: PayrollSummary;
  employeeExpense: number | null;
};

export type DepartmentPayrollGroup = {
  name: string;
  slug: string;
  employees: EmployeePayrollRow[];
  totalNet: number;
  totalExpense: number;
  employeeCount: number;
};

export type MonthlyPayrollReport = {
  monthStart: string;
  departments: DepartmentPayrollGroup[];
  grandTotalNet: number;
  grandTotalExpense: number;
  totalEmployees: number;
};

export async function loadDepartmentPayroll(
  month: string,
): Promise<MonthlyPayrollReport> {
  const monthStart = startOfMonthDateString(month);
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, job_designation, department, is_active, role",
    )
    .eq("role", "employee")
    .eq("is_active", true)
    .order("full_name");

  const employees = (data ?? []) as DepartmentEmployee[];

  const rows: EmployeePayrollRow[] = await Promise.all(
    employees.map(async (employee) => {
      const { payrollSummary } = await loadMonthAttendance(employee.id, monthStart);
      return {
        employee,
        payroll: payrollSummary,
        employeeExpense: employeePayrollExpense(payrollSummary),
      };
    }),
  );

  const departments = groupEmployeesByDepartment(employees);
  const payrollById = new Map(rows.map((row) => [row.employee.id, row]));

  const groups: DepartmentPayrollGroup[] = departments.map((department) => {
    const departmentRows = department.employees
      .map((employee) => payrollById.get(employee.id))
      .filter((row): row is EmployeePayrollRow => row !== undefined);

    const totalNet = departmentRows.reduce(
      (sum, row) => sum + (row.payroll.net_salary ?? 0),
      0,
    );
    const totalExpense = departmentRows.reduce(
      (sum, row) => sum + (row.employeeExpense ?? 0),
      0,
    );

    return {
      name: department.name,
      slug: department.slug,
      employees: departmentRows,
      totalNet: Math.round(totalNet * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      employeeCount: departmentRows.length,
    };
  });

  const grandTotalNet = groups.reduce((sum, group) => sum + group.totalNet, 0);
  const grandTotalExpense = groups.reduce(
    (sum, group) => sum + group.totalExpense,
    0,
  );

  return {
    monthStart,
    departments: groups,
    grandTotalNet: Math.round(grandTotalNet * 100) / 100,
    grandTotalExpense: Math.round(grandTotalExpense * 100) / 100,
    totalEmployees: rows.length,
  };
}
