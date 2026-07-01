export type UserRole = "admin" | "employee";

export type TaskStatus = "pending" | "completed";

export type KpiFlag = "green" | "yellow" | "red" | "no_tasks";

export type TerminationStatus =
  | "none"
  | "eligible"
  | "under_review"
  | "resolved";

export type WarningStatus = "active" | "acknowledged";

export type RewardStatus = "eligible" | "issued" | "declined";

export type ReviewStatus = "eligible" | "under_review" | "resolved";

export type AttendanceStatus =
  | "present"
  | "late"
  | "paid_leave"
  | "half_day"
  | "short_leave"
  | "absent"
  | "sunday_leave";

export type ShortLeaveType = "late_arrival" | "early_departure";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  termination_review_status: TerminationStatus;
  hire_date: string | null;
  job_designation: string | null;
  department: string | null;
  monthly_salary: number | null;
  kpi_tracked: boolean;
  created_at: string;
  updated_at: string;
};
