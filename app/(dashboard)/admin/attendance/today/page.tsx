import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { sortEmployeesByDepartment } from "@/lib/departments/department-utils";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, getTodayDateString, normalizeDateString } from "@/lib/utils/dates";
import {
  BulkAttendanceTable,
  type BulkAttendanceEmployee,
} from "@/components/admin/bulk-attendance-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AttendanceStatus, ShortLeaveType } from "@/types/domain";
import type { Tables } from "@/types/database.types";

export default async function AdminTodayAttendancePage() {
  await requireRole(["admin"]);
  const today = getTodayDateString();
  const supabase = await createClient();

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

  const employeeIds = employees.map((emp) => emp.id);
  const attendanceByEmployee = new Map<
    string,
    Pick<
      Tables<"attendance_records">,
      "status" | "short_leave_type" | "is_auto_generated"
    >
  >();

  if (employeeIds.length > 0) {
    const { data: attendanceRows } = await supabase
      .from("attendance_records")
      .select("employee_id, status, short_leave_type, is_auto_generated")
      .eq("attendance_date", today)
      .in("employee_id", employeeIds);

    for (const row of attendanceRows ?? []) {
      attendanceByEmployee.set(row.employee_id, {
        status: row.status,
        short_leave_type: row.short_leave_type,
        is_auto_generated: row.is_auto_generated,
      });
    }
  }

  const bulkEmployees: BulkAttendanceEmployee[] = sortEmployeesByDepartment(
    employees.map((emp) => {
      const attendance = attendanceByEmployee.get(emp.id);
      return {
        id: emp.id,
        full_name: emp.full_name,
        department: emp.department,
        status: (attendance?.status as AttendanceStatus | undefined) ?? null,
        short_leave_type:
          (attendance?.short_leave_type as ShortLeaveType | undefined) ?? null,
        is_auto_generated: attendance?.is_auto_generated ?? false,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/attendance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to attendance
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Mark today&apos;s attendance
        </h1>
        <p className="text-muted-foreground">
          {formatDateLabel(today)} — update every employee on one page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All employees</CardTitle>
          <CardDescription>
            Choose a status for each employee, then save all at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkAttendanceTable
            attendanceDate={today}
            employees={bulkEmployees}
          />
        </CardContent>
      </Card>
    </div>
  );
}
