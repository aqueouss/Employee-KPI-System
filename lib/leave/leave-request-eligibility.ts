import { getNowInTimezone, isSunday } from "@/lib/utils/dates";
import type { LeaveRequestType } from "@/types/domain";

export const LEAVE_CUTOFF_MINUTES: Record<LeaveRequestType, number> = {
  paid_leave: 10 * 60,
  half_day: 14 * 60,
  short_leave: 16 * 60 + 30,
};

export const LEAVE_CUTOFF_LABELS: Record<LeaveRequestType, string> = {
  paid_leave: "10:00 AM",
  half_day: "2:00 PM",
  short_leave: "4:30 PM",
};

export function validateLeaveRequestEligibility(
  leaveDate: string,
  leaveType: LeaveRequestType,
  timezone: string,
): string | null {
  const { date: today, minutes } = getNowInTimezone(timezone);

  if (leaveDate < today) {
    return "Leave can only be applied for today or future dates.";
  }

  if (isSunday(leaveDate)) {
    return "Leave cannot be applied for Sundays.";
  }

  if (leaveDate === today && minutes >= LEAVE_CUTOFF_MINUTES[leaveType]) {
    return `Today's ${leaveTypeLabel(leaveType)} requests must be submitted before ${LEAVE_CUTOFF_LABELS[leaveType]}. Apply for a future date instead.`;
  }

  return null;
}

export function canApplyLeaveTypeToday(
  leaveType: LeaveRequestType,
  timezone: string,
): boolean {
  const { minutes } = getNowInTimezone(timezone);
  return minutes < LEAVE_CUTOFF_MINUTES[leaveType];
}

export function leaveTypeLabel(type: LeaveRequestType): string {
  switch (type) {
    case "paid_leave":
      return "full-day leave";
    case "half_day":
      return "half-day leave";
    case "short_leave":
      return "short leave";
  }
}
