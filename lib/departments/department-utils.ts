import type { KpiFlag } from "@/types/domain";
import type { Tables } from "@/types/database.types";

export type DepartmentEmployee = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "job_designation" | "department" | "is_active" | "role"
>;

export type DepartmentSummary = {
  name: string;
  slug: string;
  employeeCount: number;
  activeCount: number;
  employees: DepartmentEmployee[];
};

export type DepartmentPerformance = DepartmentSummary & {
  flagCounts: Record<KpiFlag, number>;
  avgCompletionPct: number;
  snapshotDays: number;
  employeeStats: Array<{
    employee: DepartmentEmployee;
    flagCounts: Record<KpiFlag, number>;
    avgCompletionPct: number;
    snapshotDays: number;
  }>;
};

export const UNASSIGNED_DEPARTMENT = "Unassigned";

/** Preferred department order on admin views (Sales first, Marketing second). */
export const DEPARTMENT_DISPLAY_ORDER = ["Sales", "Marketing"] as const;

export function departmentSortRank(department: string | null | undefined): number {
  const normalized = normalizeDepartment(department);
  const lower = normalized.toLowerCase();
  const preferredIndex = DEPARTMENT_DISPLAY_ORDER.findIndex(
    (name) => name.toLowerCase() === lower,
  );
  if (preferredIndex >= 0) return preferredIndex;
  if (normalized === UNASSIGNED_DEPARTMENT) return Number.MAX_SAFE_INTEGER;
  return DEPARTMENT_DISPLAY_ORDER.length;
}

export function compareDepartments(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const rankA = departmentSortRank(a);
  const rankB = departmentSortRank(b);
  if (rankA !== rankB) return rankA - rankB;
  if (rankA === DEPARTMENT_DISPLAY_ORDER.length) {
    return normalizeDepartment(a).localeCompare(normalizeDepartment(b));
  }
  return 0;
}

export function sortEmployeesByDepartment<
  T extends { full_name: string; department?: string | null },
>(employees: T[]): T[] {
  return [...employees].sort((a, b) => {
    const deptCmp = compareDepartments(a.department, b.department);
    if (deptCmp !== 0) return deptCmp;
    return a.full_name.localeCompare(b.full_name);
  });
}

export function departmentToSlug(department: string): string {
  return encodeURIComponent(department.trim());
}

export function slugToDepartment(slug: string): string {
  return decodeURIComponent(slug);
}

export function normalizeDepartment(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : UNASSIGNED_DEPARTMENT;
}

export function groupEmployeesByDepartment(
  employees: DepartmentEmployee[],
): DepartmentSummary[] {
  const map = new Map<string, DepartmentEmployee[]>();

  for (const employee of employees) {
    const name = normalizeDepartment(employee.department);
    const list = map.get(name) ?? [];
    list.push(employee);
    map.set(name, list);
  }

  return Array.from(map.entries())
    .map(([name, group]) => ({
      name,
      slug: departmentToSlug(name),
      employeeCount: group.length,
      activeCount: group.filter((e) => e.is_active).length,
      employees: group.sort((a, b) => a.full_name.localeCompare(b.full_name)),
    }))
    .sort((a, b) => compareDepartments(a.name, b.name));
}

export function emptyFlagCounts(): Record<KpiFlag, number> {
  return { green: 0, yellow: 0, red: 0, no_tasks: 0 };
}

export function aggregateDepartmentPerformance(
  department: DepartmentSummary,
  snapshots: Array<
    Pick<Tables<"daily_kpi_snapshots">, "employee_id" | "flag" | "completion_pct">
  >,
): DepartmentPerformance {
  const flagCounts = emptyFlagCounts();
  let completionTotal = 0;
  let snapshotDays = 0;

  const byEmployee = new Map<
    string,
    { flagCounts: Record<KpiFlag, number>; completionTotal: number; days: number }
  >();

  for (const snapshot of snapshots) {
    flagCounts[snapshot.flag] += 1;
    completionTotal += snapshot.completion_pct;
    snapshotDays += 1;

    const current = byEmployee.get(snapshot.employee_id) ?? {
      flagCounts: emptyFlagCounts(),
      completionTotal: 0,
      days: 0,
    };
    current.flagCounts[snapshot.flag] += 1;
    current.completionTotal += snapshot.completion_pct;
    current.days += 1;
    byEmployee.set(snapshot.employee_id, current);
  }

  const employeeStats = department.employees.map((employee) => {
    const stats = byEmployee.get(employee.id);
    return {
      employee,
      flagCounts: stats?.flagCounts ?? emptyFlagCounts(),
      avgCompletionPct:
        stats && stats.days > 0
          ? Math.round(stats.completionTotal / stats.days)
          : 0,
      snapshotDays: stats?.days ?? 0,
    };
  });

  return {
    ...department,
    flagCounts,
    avgCompletionPct:
      snapshotDays > 0 ? Math.round(completionTotal / snapshotDays) : 0,
    snapshotDays,
    employeeStats,
  };
}
