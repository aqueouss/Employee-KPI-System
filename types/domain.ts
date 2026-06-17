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

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  termination_review_status: TerminationStatus;
  hire_date: string | null;
  job_designation: string | null;
  created_at: string;
  updated_at: string;
};
