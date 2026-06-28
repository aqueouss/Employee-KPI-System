export const COMPANY = {
  name: "AQUEOUSS",
  address:
    "WH-29, Mayapuri Phase 1, Mayapuri Industrial Area, Delhi 110064",
  emails: ["admin@aqueouss.in", "info@aqueouss.in"],
  phone: "+91 8130 600 209",
  web: "www.aqueouss.in",
  gstin: "07ABGFA2761H1ZK",
} as const;

export const PAYSLIP_THEME = {
  cyan: "#00bcd4",
  cyanLight: "#4dd0e1",
  headerBg: "#d9edf7",
  border: "#222222",
  tableBorder: "#5a9bb5",
  text: "#111111",
  muted: "#333333",
} as const;

/** A4 content width in px at 96dpi (210mm − margins). */
export const PAYSLIP_WIDTH_PX = 720;

/** Target single-page height in px (A4 at ~96dpi minus PDF margins). */
export const PAYSLIP_HEIGHT_PX = 1010;
