import { COMPANY } from "@/lib/payroll/payslip.constants";
import type { MonthlyAttendanceExport } from "@/lib/reports/load-monthly-attendance-export";
import {
  REPORT_CELL_STYLE,
  REPORT_DOCUMENT_STYLE,
  REPORT_HEADER_CELL_STYLE,
  REPORT_NAME_CELL_STYLE,
  REPORT_TABLE_STYLE,
  attendanceCodeStyle,
} from "@/lib/reports/report-document-styles";

export function MonthlyAttendanceReportDocument({
  report,
}: {
  report: MonthlyAttendanceExport;
}) {
  const dayHeaders = Array.from({ length: report.daysInMonth }, (_, index) =>
    index + 1,
  );

  return (
    <div style={REPORT_DOCUMENT_STYLE}>
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
        ATTENDANCE FOR THE MONTH OF {report.monthLabel}
      </div>

      <table style={REPORT_TABLE_STYLE}>
        <thead>
          <tr>
            <th style={{ ...REPORT_HEADER_CELL_STYLE, width: "28px" }}>S. No.</th>
            <th
              style={{
                ...REPORT_HEADER_CELL_STYLE,
                width: "120px",
                background: "#b6d7a8",
              }}
            >
              NAME
            </th>
            {dayHeaders.map((day) => (
              <th key={day} style={{ ...REPORT_HEADER_CELL_STYLE, width: "22px" }}>
                {day}
              </th>
            ))}
            <th style={{ ...REPORT_HEADER_CELL_STYLE, width: "42px" }}>TOTAL</th>
            <th style={{ ...REPORT_HEADER_CELL_STYLE, width: "52px" }}>
              BALANCE (Previous)
            </th>
            <th style={{ ...REPORT_HEADER_CELL_STYLE, width: "52px" }}>
              New Balance
            </th>
            <th style={{ ...REPORT_HEADER_CELL_STYLE, width: "52px" }}>
              OVERTIME
            </th>
            <th style={{ ...REPORT_HEADER_CELL_STYLE, width: "36px" }}>Late</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={row.serial}>
              <td style={REPORT_CELL_STYLE}>{row.serial}</td>
              <td style={REPORT_NAME_CELL_STYLE}>{row.name}</td>
              {dayHeaders.map((day) => {
                const code = row.days[day] ?? "";
                return (
                  <td key={day} style={attendanceCodeStyle(code)}>
                    {code}
                  </td>
                );
              })}
              <td style={REPORT_CELL_STYLE}>{row.total}</td>
              <td style={REPORT_CELL_STYLE}>{row.balancePrevious}</td>
              <td style={REPORT_CELL_STYLE}>{row.newBalance}</td>
              <td
                style={{
                  ...REPORT_CELL_STYLE,
                  background: row.overtime ? "#ffff00" : undefined,
                }}
              >
                {row.overtime}
              </td>
              <td style={REPORT_CELL_STYLE}>{row.late || ""}</td>
            </tr>
          ))}
          <tr>
            <td style={REPORT_CELL_STYLE} colSpan={2}>
              Total
            </td>
            {dayHeaders.map((day) => (
              <td key={day} style={REPORT_CELL_STYLE} />
            ))}
            <td style={{ ...REPORT_CELL_STYLE, fontWeight: 700 }}>
              {report.totalDays}
            </td>
            <td style={REPORT_CELL_STYLE} colSpan={4} />
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
