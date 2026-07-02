import type { CSSProperties } from "react";

import { COMPANY } from "@/lib/payroll/payslip.constants";
import { formatInrOrDash } from "@/lib/payroll/format-month-label";
import type { MonthlyPayrollExport } from "@/lib/reports/load-monthly-payroll-export";

const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "4px 3px",
  fontSize: "10px",
  textAlign: "center",
  verticalAlign: "middle",
};

export function MonthlyPayrollReportDocument({
  report,
}: {
  report: MonthlyPayrollExport;
}) {
  return (
    <div
      style={{
        width: "1120px",
        padding: "12px",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        background: "#fff",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 700 }}>{COMPANY.name}</div>
      <div style={{ fontSize: "11px", marginBottom: "8px" }}>
        {COMPANY.address.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        SALARY SUMMARY WITH CONV. FOR THE MONTH OF {report.monthLabel}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {[
              "S. NO.",
              "NAME OF STAFF",
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
            ].map((heading) => (
              <th key={heading} style={{ ...cellStyle, fontWeight: 700 }}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={row.serial}>
              <td style={cellStyle}>{row.serial}</td>
              <td
                style={{
                  ...cellStyle,
                  textAlign: "left",
                  background: "#b6d7a8",
                  fontWeight: 600,
                }}
              >
                {row.name}
              </td>
              <td style={cellStyle}>{formatInrOrDash(row.fixedSalary)}</td>
              <td style={cellStyle}>{row.daysWorked}</td>
              <td style={cellStyle}>{formatInrOrDash(row.totalAmount)}</td>
              <td style={cellStyle}>{formatInrOrDash(row.conveyance)}</td>
              <td style={cellStyle}>{formatInrOrDash(row.overtime)}</td>
              <td style={cellStyle}>{formatInrOrDash(row.incentives)}</td>
              <td style={cellStyle}>{formatInrOrDash(row.advanceDeduction)}</td>
              <td style={cellStyle}>{formatInrOrDash(row.advancePending)}</td>
              <td style={cellStyle}>{formatInrOrDash(row.previousBalance)}</td>
              <td style={{ ...cellStyle, fontWeight: 700 }}>
                {formatInrOrDash(row.netPayable)}
              </td>
              <td style={{ ...cellStyle, textAlign: "left" }}>{row.remark}</td>
            </tr>
          ))}
          <tr>
            <td style={cellStyle} colSpan={2}>
              Total
            </td>
            <td style={cellStyle}>{formatInrOrDash(report.totals.fixedSalary)}</td>
            <td style={cellStyle}>{report.totals.daysWorked}</td>
            <td style={cellStyle}>{formatInrOrDash(report.totals.totalAmount)}</td>
            <td style={cellStyle}>{formatInrOrDash(report.totals.conveyance)}</td>
            <td style={cellStyle}>{formatInrOrDash(report.totals.overtime)}</td>
            <td style={cellStyle}>{formatInrOrDash(report.totals.incentives)}</td>
            <td style={cellStyle}>
              {formatInrOrDash(report.totals.advanceDeduction)}
            </td>
            <td style={cellStyle}>
              {formatInrOrDash(report.totals.advancePending)}
            </td>
            <td style={cellStyle}>
              {formatInrOrDash(report.totals.previousBalance)}
            </td>
            <td style={{ ...cellStyle, fontWeight: 700 }}>
              {formatInrOrDash(report.totals.netPayable)}
            </td>
            <td style={cellStyle} />
          </tr>
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "28px",
          fontSize: "11px",
          fontWeight: 700,
        }}
      >
        <span>PREPARED BY</span>
        <span>APPROVED BY</span>
      </div>
    </div>
  );
}
