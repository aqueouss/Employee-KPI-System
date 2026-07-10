import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayDateString } from "@/lib/utils/dates";
import {
  getKpiRules,
  markWeeklyOverdueRedSnapshots,
} from "@/services/kpi/kpi.service";
import { reconcileMonthlyWarning } from "@/services/warnings/warning.service";

/** Persists weekly-overdue red flags on task start dates (best-effort). */
export async function syncWeeklyOverdueSnapshotsForEmployee(
  employeeId: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const rules = await getKpiRules(admin);
    const today = getTodayDateString(rules.company_timezone);
    await markWeeklyOverdueRedSnapshots(admin, employeeId, today, rules);
    await reconcileMonthlyWarning(admin, employeeId, today, rules, today);
  } catch {
    // Nightly cron remains the source of truth if admin client is unavailable.
  }
}
