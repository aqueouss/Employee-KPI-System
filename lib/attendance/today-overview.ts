import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeDateString } from "@/lib/utils/dates";
import type { AttendanceStatus, ShortLeaveType } from "@/types/domain";
import type { Database, Tables } from "@/types/database.types";

export type TodayAttendanceEmployee = {
  id: string;
  full_name: string;
  department: string | null;
  status: AttendanceStatus | null;
  short_leave_type: ShortLeaveType | null;
};

export type TodayAttendanceOverview = {
  employees: TodayAttendanceEmployee[];
  counts: Record<AttendanceStatus | "unmarked", number>;
};

const STATUS_ORDER: (AttendanceStatus | "unmarked")[] = [
  "present",
  "late",
  "half_day",
  "short_leave",
  "paid_leave",
  "sunday_leave",
  "absent",
  "unmarked",
];

export function sortTodayAttendanceEmployees(
  employees: TodayAttendanceEmployee[],
): TodayAttendanceEmployee[] {
  const rank = new Map(STATUS_ORDER.map((status, index) => [status, index]));

  return [...employees].sort((a, b) => {
    const aRank = rank.get(a.status ?? "unmarked") ?? 99;
    const bRank = rank.get(b.status ?? "unmarked") ?? 99;
    if (aRank !== bRank) return aRank - bRank;
    return a.full_name.localeCompare(b.full_name);
  });
}

export async function loadTodayAttendanceOverview(
  supabase: SupabaseClient<Database>,
  today: string,
): Promise<TodayAttendanceOverview> {
  const { data: employeeRows } = await supabase
    .from("profiles")
    .select("id, full_name, department, hire_date")
    .eq("role", "employee")
    .eq("is_active", true)
    .order("full_name");

  const employees = (employeeRows ?? []).filter((emp) => {
    if (!emp.hire_date) return true;
    return normalizeDateString(emp.hire_date) <= today;
  }) as Pick<
    Tables<"profiles">,
    "id" | "full_name" | "department" | "hire_date"
  >[];

  const attendanceByEmployee = new Map<
    string,
    Pick<Tables<"attendance_records">, "status" | "short_leave_type">
  >();

  const employeeIds = employees.map((emp) => emp.id);
  if (employeeIds.length > 0) {
    const { data: attendanceRows } = await supabase
      .from("attendance_records")
      .select("employee_id, status, short_leave_type")
      .eq("attendance_date", today)
      .in("employee_id", employeeIds);

    for (const row of attendanceRows ?? []) {
      attendanceByEmployee.set(row.employee_id, {
        status: row.status,
        short_leave_type: row.short_leave_type,
      });
    }
  }

  const counts: Record<AttendanceStatus | "unmarked", number> = {
    present: 0,
    late: 0,
    paid_leave: 0,
    half_day: 0,
    short_leave: 0,
    absent: 0,
    sunday_leave: 0,
    unmarked: 0,
  };

  const overviewEmployees: TodayAttendanceEmployee[] = employees.map((emp) => {
    const attendance = attendanceByEmployee.get(emp.id);
    const status = (attendance?.status as AttendanceStatus | undefined) ?? null;

    if (status) {
      counts[status] += 1;
    } else {
      counts.unmarked += 1;
    }

    return {
      id: emp.id,
      full_name: emp.full_name,
      department: emp.department,
      status,
      short_leave_type:
        (attendance?.short_leave_type as ShortLeaveType | undefined) ?? null,
    };
  });

  return {
    employees: sortTodayAttendanceEmployees(overviewEmployees),
    counts,
  };
}
