import type { CSSProperties } from "react";

export const REPORT_CELL_STYLE: CSSProperties = {
  border: "1px solid #000",
  padding: "7px 4px 8px",
  fontSize: "10px",
  lineHeight: "1.35",
  textAlign: "center",
  verticalAlign: "middle",
  boxSizing: "border-box",
  minHeight: "24px",
  overflow: "visible",
};

export const REPORT_HEADER_CELL_STYLE: CSSProperties = {
  ...REPORT_CELL_STYLE,
  fontWeight: 700,
  padding: "8px 4px 9px",
  minHeight: "28px",
};

export const REPORT_NAME_CELL_STYLE: CSSProperties = {
  ...REPORT_CELL_STYLE,
  textAlign: "left",
  background: "#b6d7a8",
  fontWeight: 600,
  padding: "7px 6px 8px",
};

export const REPORT_DOCUMENT_STYLE: CSSProperties = {
  width: "1180px",
  padding: "16px 20px 24px",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#000",
  background: "#fff",
  lineHeight: 1.35,
  boxSizing: "border-box",
};

export const REPORT_TABLE_STYLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

export function attendanceCodeStyle(code: string): CSSProperties {
  switch (code) {
    case "A":
      return {
        ...REPORT_CELL_STYLE,
        background: "#ff0000",
        color: "#fff",
        fontWeight: 700,
      };
    case "HD":
      return {
        ...REPORT_CELL_STYLE,
        background: "#4a86e8",
        color: "#fff",
        fontWeight: 700,
      };
    case "PL":
      return {
        ...REPORT_CELL_STYLE,
        background: "#fff2cc",
        fontWeight: 700,
      };
    case "SL":
      return {
        ...REPORT_CELL_STYLE,
        background: "#ffff00",
        fontWeight: 700,
      };
    default:
      return REPORT_CELL_STYLE;
  }
}
