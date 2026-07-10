import type { KpiFlag } from "@/types/domain";

export function weeklyRedFlagDateSet(dates: string[]): Set<string> {
  return new Set(dates.map((date) => date.slice(0, 10)));
}

export function effectiveKpiFlag(
  flag: KpiFlag | "none",
  date: string,
  weeklyRedFlagDates: Set<string>,
): KpiFlag | "none" {
  if (weeklyRedFlagDates.has(date.slice(0, 10))) return "red";
  return flag;
}

export function applyWeeklyRedFlagsToSnapshots<
  T extends { kpi_date: string; flag: KpiFlag },
>(snapshots: T[], weeklyRedFlagDates: string[]): T[] {
  const redDates = weeklyRedFlagDateSet(weeklyRedFlagDates);
  if (redDates.size === 0) return snapshots;

  return snapshots.map((snapshot) =>
    redDates.has(snapshot.kpi_date.slice(0, 10))
      ? { ...snapshot, flag: "red" as const }
      : snapshot,
  );
}
