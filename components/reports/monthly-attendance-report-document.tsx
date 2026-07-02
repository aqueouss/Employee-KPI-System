import type { CSSProperties } from "react";

import { COMPANY } from "@/lib/payroll/payslip.constants";
import type { MonthlyAttendanceExport } from "@/lib/reports/load-monthly-attendance-export";

const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "3px 2px",
  fontSize: "10px",
  textAlign: "center",
  verticalAlign: "middle",
};

function codeStyle(code: string): CSSProperties {
  switch (code) {
    case "A":
      return { ...cellStyle, background: "#ff0000", color: "#fff", fontWeight: 700 };
    case "HD":
      return { ...cellStyle, background: "#4a86e8", color: "#fff", fontWeight: 700 };
    case "SL":
      return { ...cellStyle, background: "#ffff00", fontWeight: 700 };
    default:
      return cellStyle;
  }
}

export function MonthlyAttendanceReportDocument({
  report,
}: {
  report: MonthlyAttendanceExport;
}) {
  const dayHeaders = Array.from({ length: report.daysInMonth }, (_, index) =>
    index + 1,
  );

  return (
    <div
      style={{
        width: "1180px",
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
        ATTENDANCE FOR THE MONTH OF {report.monthLabel}
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...cellStyle, width: "28px" }}>S. No.</th>
            <th style={{ ...cellStyle, width: "120px", background: "#b6d7a8" }}>
              NAME
            </th>
            {dayHeaders.map((day) => (
              <th key={day} style={{ ...cellStyle, width: "22px" }}>
                {day}
              </th>
            ))}
            <th style={{ ...cellStyle, width: "42px" }}>TOTAL</th>
            <th style={{ ...cellStyle, width: "52px" }}>BALANCE (Previous)</th>
            <th style={{ ...cellStyle, width: "52px" }}>New Balance</th>
            <th style={{ ...cellStyle, width: "52px" }}>OVERTIME</th>
            <th style={{ ...cellStyle, width: "36px" }}>Late</th>
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
              {dayHeaders.map((day) => {
                const code = row.days[day] ?? "";
                return (
                  <td key={day} style={codeStyle(code)}>
                    {code}
                  </td>
                );
              })}
              <td style={cellStyle}>{row.total}</td>
              <td style={cellStyle}>{row.balancePrevious}</td>
              <td style={cellStyle}>{row.newBalance}</td>
              <td
                style={{
                  ...cellStyle,
                  background: row.overtime ? "#ffff00" : undefined,
                }}
              >
                {row.overtime}
              </td>
              <td style={cellStyle}>{row.late || ""}</td>
            </tr>
          ))}
          <tr>
            <td style={cellStyle} colSpan={2}>
              Total
            </td>
            {dayHeaders.map((day) => (
              <td key={day} style={cellStyle} />
            ))}
            <td style={{ ...cellStyle, fontWeight: 700 }}>{report.totalDays}</td>
            <td style={cellStyle} colSpan={4} />
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
