import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { KpiRulesForm } from "@/components/admin/kpi-rules-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function AdminKpiRulesPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kpi_rules")
    .select("*")
    .eq("id", 1)
    .single();

  const rules = data as Tables<"kpi_rules"> | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">KPI Rules</h1>
        <p className="text-muted-foreground">
          Configure thresholds, warning, and reward rules. Changes apply to
          future KPI calculations; historical snapshots are unchanged.
        </p>
      </div>

      {error || !rules ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Failed to load KPI rules{error ? `: ${error.message}` : "."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Saving increments the rules version recorded on each snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KpiRulesForm rules={rules} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
