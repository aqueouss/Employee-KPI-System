import { COMPANY } from "@/lib/payroll/payslip.constants";
import { formatInrOrDash } from "@/lib/payroll/format-month-label";
import type { MonthlyPayrollExport } from "@/lib/reports/load-monthly-payroll-export";
import {
  REPORT_CELL_STYLE,
  REPORT_DOCUMENT_STYLE,
  REPORT_HEADER_CELL_STYLE,
  REPORT_NAME_CELL_STYLE,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/report-document-styles";

const PAYROLL_HEADINGS = [
  "S. NO.",
  "NAME OF STAFF",
  "Account Holder Name",
  "Bank Name",
  "A/C No.",
  "IFSC Code",
  "NEW FIXED SALARY",
  "NO. OF DAY",
  "TOTAL AMT.",
  "Reimbursment/Conveyance",
  "OVERTIME",
  "INCENTIVES",
  "ADVANCE DEDUCTION",
  "ADVANCE PENDING AMOUNT",
  "Previous Balance Amount",
  "Net Payable",
  "Remark",
] as const;

function headerStyle(heading: (typeof PAYROLL_HEADINGS)[number]) {
  if (heading === "NAME OF STAFF") {
    return {
      ...REPORT_HEADER_CELL_STYLE,
      background: "#b6d7a8",
      textAlign: "left" as const,
    };
  }

  if (
    heading === "Account Holder Name" ||
    heading === "Bank Name" ||
    heading === "A/C No." ||
    heading === "IFSC Code"
  ) {
    return {
      ...REPORT_HEADER_CELL_STYLE,
      fontSize: "9px",
      padding: "8px 3px 9px",
    };
  }

  return REPORT_HEADER_CELL_STYLE;
}

export function MonthlyPayrollReportDocument({
  report,
}: {
  report: MonthlyPayrollExport;
}) {
  return (
    <div style={{ ...REPORT_DOCUMENT_STYLE, width: "1500px" }}>
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
        <thead>
          <tr>
            {PAYROLL_HEADINGS.map((heading) => (
              <th key={heading} style={headerStyle(heading)}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={row.serial}>
              <td style={REPORT_CELL_STYLE}>{row.serial}</td>
              <td style={REPORT_NAME_CELL_STYLE}>{row.name}</td>
              <td style={{ ...REPORT_CELL_STYLE, textAlign: "left" }}>
                {row.accountHolderName}
              </td>
              <td style={{ ...REPORT_CELL_STYLE, textAlign: "left" }}>
                {row.bankName}
              </td>
              <td style={REPORT_CELL_STYLE}>{row.accountNumber}</td>
              <td style={REPORT_CELL_STYLE}>{row.ifscCode}</td>
              <td style={REPORT_CELL_STYLE}>{formatInrOrDash(row.fixedSalary)}</td>
              <td style={REPORT_CELL_STYLE}>{row.daysWorked}</td>
              <td style={REPORT_CELL_STYLE}>{formatInrOrDash(row.totalAmount)}</td>
              <td style={REPORT_CELL_STYLE}>{formatInrOrDash(row.conveyance)}</td>
              <td style={REPORT_CELL_STYLE}>{formatInrOrDash(row.overtime)}</td>
              <td style={REPORT_CELL_STYLE}>{formatInrOrDash(row.incentives)}</td>
              <td style={REPORT_CELL_STYLE}>
                {formatInrOrDash(row.advanceDeduction)}
              </td>
              <td style={REPORT_CELL_STYLE}>
                {formatInrOrDash(row.advancePending)}
              </td>
              <td style={REPORT_CELL_STYLE}>
                {formatInrOrDash(row.previousBalance)}
              </td>
              <td style={{ ...REPORT_CELL_STYLE, fontWeight: 700 }}>
                {formatInrOrDash(row.netPayable)}
              </td>
              <td style={{ ...REPORT_CELL_STYLE, textAlign: "left" }}>
                {row.remark}
              </td>
            </tr>
          ))}
          <tr>
            <td style={REPORT_CELL_STYLE} colSpan={2}>
              Total
            </td>
            <td style={REPORT_CELL_STYLE} colSpan={4} />
            <td style={REPORT_CELL_STYLE}>
              {formatInrOrDash(report.totals.fixedSalary)}
            </td>
            <td style={REPORT_CELL_STYLE}>{report.totals.daysWorked}</td>
            <td style={REPORT_CELL_STYLE}>
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
            <td style={REPORT_CELL_STYLE}>
              {formatInrOrDash(report.totals.advancePending)}
            </td>
            <td style={REPORT_CELL_STYLE}>
              {formatInrOrDash(report.totals.previousBalance)}
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
          fontWeight: 700,
          lineHeight: 1.4,
        }}
      >
        <span>PREPARED BY</span>
        <span>APPROVED BY</span>
      </div>
    </div>
  );
}
