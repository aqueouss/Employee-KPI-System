import { COMPANY, PAYROLL_PREPARED_BY } from "@/lib/payroll/payslip.constants";
import { formatInrOrDash } from "@/lib/payroll/format-month-label";
import type { MonthlyPayrollExport } from "@/lib/reports/load-monthly-payroll-export";
import {
  REPORT_CELL_STYLE,
  REPORT_DOCUMENT_STYLE,
  REPORT_HEADER_CELL_STYLE,
  REPORT_NAME_CELL_STYLE,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/report-document-styles";

type PayrollColumn = {
  key: string;
  heading: string;
  width: string;
  bold?: boolean;
  wrap?: boolean;
};

const PAYROLL_COLUMNS: PayrollColumn[] = [
  { key: "serial", heading: "S. NO.", width: "34px" },
  { key: "name", heading: "NAME OF STAFF", width: "108px" },
  { key: "accountHolder", heading: "Account Holder Name", width: "92px" },
  { key: "bankName", heading: "Bank Name", width: "78px" },
  { key: "accountNumber", heading: "A/C No.", width: "82px" },
  { key: "ifsc", heading: "IFSC Code", width: "74px" },
  { key: "fixedSalary", heading: "NEW FIXED SALARY", width: "72px", bold: true },
  { key: "daysWorked", heading: "NO. OF DAY", width: "48px", bold: true },
  { key: "totalAmount", heading: "TOTAL AMT.", width: "62px", bold: true },
  {
    key: "conveyance",
    heading: "Reimb./Conveyance",
    width: "82px",
    wrap: true,
  },
  { key: "overtime", heading: "OVERTIME", width: "52px" },
  { key: "incentives", heading: "INCENTIVES", width: "58px" },
  { key: "advanceDeduction", heading: "ADVANCE DEDUCTION", width: "72px", wrap: true },
  { key: "netPayable", heading: "Net Payable", width: "62px", bold: true },
  { key: "remark", heading: "Remark", width: "72px" },
];

function headerStyle(column: PayrollColumn) {
  const base = {
    ...REPORT_HEADER_CELL_STYLE,
    width: column.width,
    ...(column.wrap
      ? {
          whiteSpace: "normal" as const,
          wordBreak: "break-word" as const,
          lineHeight: 1.15,
          fontSize: "8px",
          padding: "8px 3px 9px",
        }
      : {}),
    ...(column.bold ? { fontWeight: 700 as const } : {}),
  };

  if (column.key === "name") {
    return { ...base, background: "#b6d7a8", textAlign: "left" as const };
  }

  if (
    column.key === "accountHolder" ||
    column.key === "bankName" ||
    column.key === "accountNumber" ||
    column.key === "ifsc"
  ) {
    return {
      ...base,
      fontSize: column.key === "accountNumber" ? "9px" : "8px",
      padding: "8px 3px 9px",
    };
  }

  return base;
}

function cellStyle(column: PayrollColumn) {
  return {
    ...REPORT_CELL_STYLE,
    width: column.width,
    ...(column.bold ? { fontWeight: 700 as const } : {}),
    ...(column.key === "name" ||
    column.key === "accountHolder" ||
    column.key === "bankName" ||
    column.key === "remark"
      ? { textAlign: "left" as const }
      : {}),
    ...(column.key === "name" ? REPORT_NAME_CELL_STYLE : {}),
  };
}

export function MonthlyPayrollReportDocument({
  report,
}: {
  report: MonthlyPayrollExport;
}) {
  return (
    <div style={{ ...REPORT_DOCUMENT_STYLE, width: "1420px" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
        {COMPANY.name}
      </div>
      <div style={{ fontSize: "11px", marginBottom: "10px", lineHeight: 1.4 }}>
        {COMPANY.address.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: "12px",
          lineHeight: 1.4,
        }}
      >
        SALARY SUMMARY WITH CONV. FOR THE MONTH OF {report.monthLabel}
      </div>

      <table style={REPORT_TABLE_STYLE}>
        <colgroup>
          {PAYROLL_COLUMNS.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {PAYROLL_COLUMNS.map((column) => (
              <th key={column.key} style={headerStyle(column)}>
                {column.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={row.serial}>
              <td style={cellStyle(PAYROLL_COLUMNS[0])}>{row.serial}</td>
              <td style={cellStyle(PAYROLL_COLUMNS[1])}>{row.name}</td>
              <td style={cellStyle(PAYROLL_COLUMNS[2])}>
                {row.accountHolderName}
              </td>
              <td style={cellStyle(PAYROLL_COLUMNS[3])}>{row.bankName}</td>
              <td style={cellStyle(PAYROLL_COLUMNS[4])}>{row.accountNumber}</td>
              <td style={cellStyle(PAYROLL_COLUMNS[5])}>{row.ifscCode}</td>
              <td style={cellStyle(PAYROLL_COLUMNS[6])}>
                {formatInrOrDash(row.fixedSalary)}
              </td>
              <td style={cellStyle(PAYROLL_COLUMNS[7])}>{row.daysWorked}</td>
              <td style={cellStyle(PAYROLL_COLUMNS[8])}>
                {formatInrOrDash(row.totalAmount)}
              </td>
              <td style={cellStyle(PAYROLL_COLUMNS[9])}>
                {formatInrOrDash(row.conveyance)}
              </td>
              <td style={cellStyle(PAYROLL_COLUMNS[10])}>
                {formatInrOrDash(row.overtime)}
              </td>
              <td style={cellStyle(PAYROLL_COLUMNS[11])}>
                {formatInrOrDash(row.incentives)}
              </td>
              <td style={cellStyle(PAYROLL_COLUMNS[12])}>
                {formatInrOrDash(row.advanceDeduction)}
              </td>
              <td style={cellStyle(PAYROLL_COLUMNS[13])}>
                {formatInrOrDash(row.netPayable)}
              </td>
              <td style={cellStyle(PAYROLL_COLUMNS[14])}>{row.remark}</td>
            </tr>
          ))}
          <tr>
            <td style={REPORT_CELL_STYLE} colSpan={2}>
              Total
            </td>
            <td style={REPORT_CELL_STYLE} colSpan={4} />
            <td style={{ ...REPORT_CELL_STYLE, fontWeight: 700 }}>
              {formatInrOrDash(report.totals.fixedSalary)}
            </td>
            <td style={{ ...REPORT_CELL_STYLE, fontWeight: 700 }}>
              {report.totals.daysWorked}
            </td>
            <td style={{ ...REPORT_CELL_STYLE, fontWeight: 700 }}>
              {formatInrOrDash(report.totals.totalAmount)}
            </td>
            <td style={REPORT_CELL_STYLE}>
              {formatInrOrDash(report.totals.conveyance)}
            </td>
            <td style={REPORT_CELL_STYLE}>
              {formatInrOrDash(report.totals.overtime)}
            </td>
            <td style={REPORT_CELL_STYLE}>
              {formatInrOrDash(report.totals.incentives)}
            </td>
            <td style={REPORT_CELL_STYLE}>
              {formatInrOrDash(report.totals.advanceDeduction)}
            </td>
            <td style={{ ...REPORT_CELL_STYLE, fontWeight: 700 }}>
              {formatInrOrDash(report.totals.netPayable)}
            </td>
            <td style={REPORT_CELL_STYLE} />
          </tr>
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "32px",
          fontSize: "11px",
          lineHeight: 1.4,
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>PREPARED BY</div>
          <div style={{ marginTop: "10px" }}>{PAYROLL_PREPARED_BY}</div>
        </div>
        <div style={{ fontWeight: 700 }}>APPROVED BY</div>
      </div>
    </div>
  );
}
