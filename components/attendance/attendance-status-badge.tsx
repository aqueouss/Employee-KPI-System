import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus } from "@/types/domain";

const META: Record<
  AttendanceStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" | "outline" }
> = {
  present: { label: "Present", variant: "success" },
  late: { label: "Late", variant: "warning" },
  paid_leave: { label: "Paid leave", variant: "secondary" },
  half_day: { label: "Half day", variant: "secondary" },
  late_half_day: { label: "Late + Half day", variant: "warning" },
  short_leave: { label: "Short leave", variant: "secondary" },
  late_short_leave: { label: "Late + Short leave", variant: "warning" },
  absent: { label: "Absent", variant: "destructive" },
  sunday_leave: { label: "Sunday leave", variant: "outline" },
};

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const m = META[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export function shortLeaveLabel(type: string | null | undefined) {
  if (type === "late_arrival") return "Arrive 11:30 AM";
  if (type === "early_departure") return "Leave 4:30 PM";
  return "";
}
