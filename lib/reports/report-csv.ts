import { buildCsv } from "@/lib/reports/build-csv";
import type { MonthlyAttendanceExport } from "@/lib/reports/load-monthly-attendance-export";
import type { MonthlyPayrollExport } from "@/lib/reports/load-monthly-payroll-export";
import { COMPANY, PAYROLL_PREPARED_BY } from "@/lib/payroll/payslip.constants";

function num(value: number | null | undefined): string {
  if (value == null) return "";
  return String(Math.round(value * 100) / 100);
}

export function buildAttendanceCsv(report: MonthlyAttendanceExport): string {
  const headerRow1 = [
    COMPANY.name,
    "",
    "",
    `ATTENDANCE FOR THE MONTH OF ${report.monthLabel}`,
  ];
  const headerRow2 = [COMPANY.address.toUpperCase()];

  const dayHeaders = Array.from({ length: report.daysInMonth }, (_, index) =>
    String(index + 1),
  );

  const tableHeader = [
    "S. No.",
    "NAME",
    ...dayHeaders,
    "TOTAL",
    "BALANCE (Previous)",
    "New Balance",
    "OVERTIME",
    "Late",
  ];

  const body = report.rows.map((row) => [
    row.serial,
    row.name,
    ...Array.from({ length: report.daysInMonth }, (_, index) =>
      row.days[index + 1] ?? "",
    ),
    num(row.total),
    num(row.balancePrevious),
    num(row.newBalance),
    row.overtime,
    num(row.late),
  ]);

  const totalRow = [
    "",
    "Total",
    ...Array.from({ length: report.daysInMonth }, () => ""),
    num(report.totalDays),
    "",
    "",
    "",
    "",
  ];

  const footer = ["", "", "", "", "", "", "PREPARED BY", "", "APPROVED BY"];

  return buildCsv([
    headerRow1,
    headerRow2,
    [],
    tableHeader,
    ...body,
    totalRow,
    [],
    footer,
  ]);
}

export function buildPayrollCsv(report: MonthlyPayrollExport): string {
  const headerRow1 = [
    COMPANY.name,
    "",
    "",
    `SALARY SUMMARY WITH CONV. FOR THE MONTH OF ${report.monthLabel}`,
  ];
  const headerRow2 = [COMPANY.address.toUpperCase()];

  const tableHeader = [
    "S. NO.",
    "NAME OF STAFF",
    "Account Holder Name",
    "Bank Name",
    "A/C No.",
    "IFSC Code",
    "NEW FIXED SALARY",
    "NO. OF DAY",
    "TOTAL AMT.",
    "Reimb./Conveyance",
    "OVERTIME",
    "INCENTIVES",
    "ADVANCE DEDUCTION",
    "Net Payable",
    "Remark",
  ];

  const body = report.rows.map((row) => [
    row.serial,
    row.name,
    row.accountHolderName,
    row.bankName,
    row.accountNumber,
    row.ifscCode,
    num(row.fixedSalary),
    num(row.daysWorked),
    num(row.totalAmount),
    num(row.conveyance),
    num(row.overtime),
    num(row.incentives),
    num(row.advanceDeduction),
    num(row.netPayable),
    row.remark,
  ]);

  const totalRow = [
    "",
    "Total",
    "",
    "",
    "",
    "",
    num(report.totals.fixedSalary),
    num(report.totals.daysWorked),
    num(report.totals.totalAmount),
    num(report.totals.conveyance),
    num(report.totals.overtime),
    num(report.totals.incentives),
    num(report.totals.advanceDeduction),
    num(report.totals.netPayable),
    "",
  ];

  const footer = ["PREPARED BY", PAYROLL_PREPARED_BY, "", "", "APPROVED BY"];

  const otherExpenseSection =
    report.otherExpenses.length > 0
      ? [
          [],
          ["OTHER EXPENSES", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          [
            "S. NO.",
            "Title",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "Expense",
            "Remarks",
          ],
          ...report.otherExpenses.map((item, index) => [
            index + 1,
            item.title,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            num(item.expense),
            item.remarks,
          ]),
        ]
      : [[]];

  return buildCsv([
    headerRow1,
    headerRow2,
    [],
    tableHeader,
    ...body,
    ...otherExpenseSection,
    [],
    totalRow,
    [],
    footer,
  ]);
}
