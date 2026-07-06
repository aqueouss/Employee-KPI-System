import type { GridDay } from "@/services/attendance/attendance.engine";

export function attendanceDayCode(
  day: GridDay,
  hireDate: string | null,
): string {
  if (!day.inMonth) return "";

  if (hireDate && day.date < hireDate.slice(0, 10)) {
    return "";
  }

  if (day.isSunday) {
    if (day.status === "absent") return "A";
    return "S";
  }

  switch (day.status) {
    case "present":
    case "late":
      return "P";
    case "absent":
      return "A";
    case "half_day":
      return "HD";
    case "late_half_day":
      return "LHD";
    case "paid_leave":
      return "PL";
    case "short_leave":
      return "SL";
    case "late_short_leave":
      return "LSL";
    case "sunday_leave":
      return "S";
    default:
      return "";
  }
}
