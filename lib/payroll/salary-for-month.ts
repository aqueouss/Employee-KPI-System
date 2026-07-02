import { normalizeDateString } from "@/lib/utils/dates";

export type SalaryRevision = {
  effective_month: string;
  monthly_salary: number;
};

export function resolveMonthlySalaryForMonth(
  revisions: SalaryRevision[],
  monthStart: string,
  profileFallback: number | null,
): number | null {
  const month = normalizeDateString(monthStart).slice(0, 10);

  const sorted = [...revisions].sort((a, b) =>
    normalizeDateString(a.effective_month).localeCompare(
      normalizeDateString(b.effective_month),
    ),
  );

  const applicable = sorted
    .filter(
      (revision) =>
        normalizeDateString(revision.effective_month).slice(0, 10) <= month,
    )
    .at(-1);

  if (applicable) {
    return Number(applicable.monthly_salary);
  }

  if (sorted.length === 0) {
    return profileFallback;
  }

  const earliestMonth = normalizeDateString(sorted[0].effective_month).slice(
    0,
    10,
  );

  if (month < earliestMonth) {
    return Number(sorted[0].monthly_salary);
  }

  return profileFallback;
}
