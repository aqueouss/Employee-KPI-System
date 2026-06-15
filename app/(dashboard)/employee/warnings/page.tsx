import { AlertTriangle } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel } from "@/lib/utils/dates";
import { WarningStatusBadge } from "@/components/warnings/warning-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

function formatMonth(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default async function EmployeeWarningsPage() {
  const profile = await requireRole(["admin", "employee"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("warnings")
    .select("*")
    .eq("employee_id", profile.id)
    .order("issued_at", { ascending: false });

  const warnings = (data ?? []) as Tables<"warnings">[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Warnings</h1>
        <p className="text-muted-foreground">
          Issued when you accumulate too many red flags in a month.
        </p>
      </div>

      {warnings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
              <AlertTriangle className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-medium">No warnings</p>
            <p className="text-sm text-muted-foreground">
              Keep your daily completion up to stay in the clear.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {warnings.map((w) => (
            <Card key={w.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {formatMonth(w.warning_month)}
                    </CardTitle>
                    <CardDescription>{w.reason}</CardDescription>
                  </div>
                  <WarningStatusBadge status={w.status} />
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Red-flag days:{" "}
                  <span className="font-medium text-foreground">
                    {w.red_flag_dates.length}
                  </span>{" "}
                  ({w.red_flag_dates.map((d) => formatDateLabel(d)).join(", ")})
                </p>
                <p className="mt-1">Issued {formatDateLabel(w.issued_at.slice(0, 10))}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
