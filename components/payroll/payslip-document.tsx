import type { CSSProperties } from "react";

import {
  COMPANY,
  PAYSLIP_THEME,
  PAYSLIP_HEIGHT_PX,
  PAYSLIP_WIDTH_PX,
} from "@/lib/payroll/payslip.constants";
import {
  formatInr,
  formatPayPeriod,
  formatPaymentDate,
} from "@/lib/payroll/format-month-label";
import { buildPayslipAmounts, type PayslipData } from "@/lib/payroll/payslip.types";

const cellBase: CSSProperties = {
  padding: "10px 12px",
  border: `1px solid ${PAYSLIP_THEME.tableBorder}`,
  fontSize: "13px",
  verticalAlign: "middle",
  lineHeight: 1.45,
};

const thStyle: CSSProperties = {
  ...cellBase,
  backgroundColor: PAYSLIP_THEME.headerBg,
  fontWeight: 700,
  textAlign: "left",
};

const tdStyle: CSSProperties = {
  ...cellBase,
};

const tdAmountStyle: CSSProperties = {
  ...cellBase,
  textAlign: "right",
  whiteSpace: "nowrap",
};

const tdTotalStyle: CSSProperties = {
  ...cellBase,
  fontWeight: 700,
  backgroundColor: PAYSLIP_THEME.headerBg,
};

const tdTotalAmountStyle: CSSProperties = {
  ...tdAmountStyle,
  fontWeight: 700,
  backgroundColor: PAYSLIP_THEME.headerBg,
};

const emptyCellStyle: CSSProperties = {
  ...cellBase,
  height: "34px",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  border: `1px solid ${PAYSLIP_THEME.tableBorder}`,
  tableLayout: "fixed",
};

function HeaderWave() {
  return (
    <svg
      width="100%"
      height="48"
      viewBox="0 0 720 48"
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%" }}
      aria-hidden
    >
      <path
        d="M0 0 L720 0 L720 20 C600 44 480 4 360 24 C240 44 120 4 0 20 Z"
        fill="#ffffff"
      />
      <path
        d="M0 0 L720 0 L720 12 C580 36 420 8 360 18 C280 30 140 6 0 14 Z"
        fill="#ffffff"
        opacity="0.85"
      />
    </svg>
  );
}

function FooterWave() {
  return (
    <svg
      width="100%"
      height="56"
      viewBox="0 0 720 56"
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%" }}
      aria-hidden
    >
      <path
        d="M0 28 C120 8 240 48 360 28 C480 8 600 48 720 24 L720 56 L0 56 Z"
        fill={PAYSLIP_THEME.cyanLight}
        opacity="0.55"
      />
      <path
        d="M0 36 C160 14 320 52 480 30 C580 16 660 40 720 32 L720 56 L0 56 Z"
        fill={PAYSLIP_THEME.cyan}
      />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" aria-hidden>
      <defs>
        <linearGradient id="aq-drop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#29b6f6" />
          <stop offset="100%" stopColor="#0288d1" />
        </linearGradient>
      </defs>
      <path
        d="M26 4 C26 4 10 24 10 34 C10 42.8 17.2 50 26 50 C34.8 50 42 42.8 42 34 C42 24 26 4 26 4 Z"
        fill="url(#aq-drop)"
      />
      <path
        d="M26 14 C26 14 18 26 18 33 C18 37.4 21.6 41 26 41 C30.4 41 34 37.4 34 33 C34 26 26 14 26 14 Z"
        fill="#b3e5fc"
        opacity="0.9"
      />
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", marginBottom: "6px", fontSize: "13px" }}>
      <span style={{ width: "130px", fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ width: "12px", flexShrink: 0 }}>:</span>
      <span style={{ flex: 1 }}>{value}</span>
    </div>
  );
}

export function PayslipDocument({ data }: { data: PayslipData }) {
  const amounts = buildPayslipAmounts(data.payroll);

  const salaryRows = [
    { label: "Basic Salary", amount: amounts.basic },
    { label: "HRA", amount: amounts.hra },
    { label: "Conveyance Allowance", amount: amounts.conveyanceAllowance },
    { label: "Special Allowance", amount: amounts.special },
  ];

  const extraRows = [
    { label: "Incentives", amount: amounts.incentives },
    { label: "Company Reimbursement", amount: amounts.companyReimbursement },
  ];

  const deductionRows = [
    { label: "Leave", amount: amounts.leaveDeduction },
    ...(amounts.advanceDeduction > 0
      ? [{ label: "Advance Payment", amount: amounts.advanceDeduction }]
      : []),
  ];

  const emptyDeductionRows = Math.max(0, 5 - deductionRows.length);

  return (
    <div
      style={{
        position: "relative",
        width: `${PAYSLIP_WIDTH_PX}px`,
        minHeight: `${PAYSLIP_HEIGHT_PX}px`,
        backgroundColor: "#ffffff",
        color: PAYSLIP_THEME.text,
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
        }}
      >
        <header style={{ width: `${PAYSLIP_WIDTH_PX}px` }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${PAYSLIP_THEME.cyan} 0%, #0097a7 100%)`,
              padding: "22px 28px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: "12px",
                  padding: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <LogoMark />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    lineHeight: 1.1,
                    color: "#ffffff",
                  }}
                >
                  {COMPANY.name}
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.92)",
                    lineHeight: 1.55,
                  }}
                >
                  <div>{COMPANY.address}</div>
                  <div>
                    Email: {COMPANY.emails[0]} | {COMPANY.emails[1]}
                  </div>
                  <div>
                    Mobile: {COMPANY.phone} | Web: {COMPANY.web}
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: "14px",
                height: "3px",
                width: "80px",
                backgroundColor: "rgba(255,255,255,0.55)",
                borderRadius: "2px",
              }}
            />
          </div>
          <HeaderWave />
        </header>

        <div style={{ flex: 1, padding: "8px 28px 0" }}>
          <div
            style={{
              textAlign: "center",
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "18px",
              marginTop: "4px",
            }}
          >
            EMPLOYEE PAY SLIP
          </div>

          <div style={{ marginBottom: "18px" }}>
            <InfoRow label="Period" value={formatPayPeriod(data.monthStart)} />
            <InfoRow label="Employee Name" value={data.employeeName} />
            <InfoRow label="Position" value={data.designation ?? "—"} />
            <InfoRow label="Department" value={data.department ?? "—"} />
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              marginBottom: "16px",
              width: "100%",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <table style={tableStyle}>
                <colgroup>
                  <col style={{ width: "58%" }} />
                  <col style={{ width: "42%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thStyle}>Earning</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryRows.map((row) => (
                    <tr key={row.label}>
                      <td style={tdStyle}>{row.label}</td>
                      <td style={tdAmountStyle}>{formatInr(row.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={tdTotalStyle}>Gross Income Total</td>
                    <td style={tdTotalAmountStyle}>{formatInr(amounts.gross)}</td>
                  </tr>
                  {extraRows.map((row) => (
                    <tr key={row.label}>
                      <td style={tdStyle}>{row.label}</td>
                      <td style={tdAmountStyle}>{formatInr(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <table style={tableStyle}>
                <colgroup>
                  <col style={{ width: "58%" }} />
                  <col style={{ width: "42%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thStyle}>Deductions</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {deductionRows.map((row) => (
                    <tr key={row.label}>
                      <td style={tdStyle}>{row.label}</td>
                      <td style={tdAmountStyle}>{formatInr(row.amount)}</td>
                    </tr>
                  ))}
                  {Array.from({ length: emptyDeductionRows }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td style={emptyCellStyle}>&nbsp;</td>
                      <td style={emptyCellStyle}>&nbsp;</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={tdTotalStyle}>Total Deductions</td>
                    <td style={tdTotalAmountStyle}>
                      {formatInr(amounts.totalDeductions)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table style={{ ...tableStyle, marginTop: "8px" }}>
                <colgroup>
                  <col style={{ width: "58%" }} />
                  <col style={{ width: "42%" }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td style={{ ...tdTotalStyle, fontSize: "14px" }}>Net Salary</td>
                    <td style={{ ...tdTotalAmountStyle, fontSize: "14px" }}>
                      {formatInr(amounts.net)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ fontSize: "13px", marginBottom: "12px" }}>
            <strong>Payment Date</strong> : {formatPaymentDate(data.monthStart)}
          </div>

          {data.notes ? (
            <div
              style={{
                fontSize: "11px",
                color: PAYSLIP_THEME.muted,
                marginBottom: "12px",
                fontStyle: "italic",
              }}
            >
              Note: {data.notes}
            </div>
          ) : null}
        </div>

        <footer
          style={{
            marginTop: "auto",
            marginLeft: "-28px",
            width: `${PAYSLIP_WIDTH_PX}px`,
          }}
        >
          <FooterWave />
          <div
            style={{
              background: `linear-gradient(135deg, ${PAYSLIP_THEME.cyan} 0%, #0097a7 100%)`,
              padding: "18px 28px 22px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#ffffff",
                lineHeight: 1.65,
                fontWeight: 500,
              }}
            >
              <div>
                This is Computer generated letter and hence does not require Signature.
              </div>
              <div style={{ marginTop: "4px", fontWeight: 700, letterSpacing: "0.03em" }}>
                Human Resource Department, {COMPANY.name}
              </div>
            </div>
            <div
              style={{
                marginTop: "12px",
                height: "3px",
                width: "80px",
                backgroundColor: "rgba(255,255,255,0.55)",
                margin: "12px auto 0",
                borderRadius: "2px",
              }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
