import type { PayrollSummary } from "@/services/attendance/attendance.engine";

export type PayslipData = {
  employeeName: string;
  employeeEmail: string;
  designation: string | null;
  department?: string | null;
  monthLabel: string;
  monthStart: string;
  payroll: PayrollSummary;
  notes: string | null;
};

export type PayslipEarnings = {
  basic: number;
  hra: number;
  conveyanceAllowance: number;
  special: number;
  gross: number;
  incentives: number;
  companyReimbursement: number;
  leaveDeduction: number;
  advanceDeduction: number;
  totalDeductions: number;
  net: number;
};

function splitMonthlySalary(monthly: number) {
  const basic = Math.round(monthly * 0.5);
  const hra = Math.round(monthly * 0.25);
  const conveyanceAllowance = Math.round(monthly * 0.08);
  let special = Math.round(monthly * 0.17);
  const sum = basic + hra + conveyanceAllowance + special;
  special += monthly - sum;

  return { basic, hra, conveyanceAllowance, special, gross: monthly };
}

export function buildPayslipAmounts(p: PayrollSummary): PayslipEarnings {
  const monthly = p.monthly_salary ?? p.calculated_salary ?? 0;
  const { basic, hra, conveyanceAllowance, special, gross } =
    splitMonthlySalary(monthly);

  const incentives = p.incentives;
  const companyReimbursement = p.conveyance;

  const leaveDeduction =
    p.monthly_salary !== null && p.calculated_salary !== null
      ? Math.max(
          0,
          Math.round((p.monthly_salary - p.calculated_salary) * 100) / 100,
        )
      : 0;
  const advanceDeduction = p.advance_deduction;
  const totalDeductions = leaveDeduction + advanceDeduction;
  const net =
    Math.round(
      (gross - totalDeductions + incentives + companyReimbursement) * 100,
    ) / 100;

  return {
    basic,
    hra,
    conveyanceAllowance,
    special,
    gross,
    incentives,
    companyReimbursement,
    leaveDeduction,
    advanceDeduction,
    totalDeductions,
    net,
  };
}
