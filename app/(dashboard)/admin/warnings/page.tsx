import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel } from "@/lib/utils/dates";
import { AcknowledgeWarningButton } from "@/components/admin/acknowledge-warning-button";
import { WarningStatusBadge } from "@/components/warnings/warning-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/types/database.types";

function formatMonth(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default async function AdminWarningsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: warningData } = await supabase
    .from("warnings")
    .select("*")
    .order("issued_at", { ascending: false });

  const warnings = (warningData ?? []) as Tables<"warnings">[];

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name, email");

  const nameById = new Map(
    (profileData ?? []).map((p) => [p.id, p.full_name]),
  );

  const activeCount = warnings.filter((w) => w.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Warnings</h1>
        <p className="text-muted-foreground">
          {warnings.length} total · {activeCount} active
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warning history</CardTitle>
          <CardDescription>
            Auto-issued by the daily KPI job. Acknowledge once reviewed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {warnings.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No warnings issued yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Red days</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warnings.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">
                      {nameById.get(w.employee_id) ?? "Unknown"}
                    </TableCell>
                    <TableCell>{formatMonth(w.warning_month)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.red_flag_dates.length}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateLabel(w.issued_at.slice(0, 10))}
                    </TableCell>
                    <TableCell>
                      <WarningStatusBadge status={w.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {w.status === "active" ? (
                        <AcknowledgeWarningButton warningId={w.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
