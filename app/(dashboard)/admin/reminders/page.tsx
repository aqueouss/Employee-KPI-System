import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  ReminderReopenButton,
  ReminderResolveControls,
} from "@/components/reminders/reminder-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function AdminRemindersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: reminderData } = await supabase
    .from("reminders")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  const reminders = (reminderData ?? []) as Tables<"reminders">[];

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name");
  const nameById = new Map((profileData ?? []).map((p) => [p.id, p.full_name]));

  const open = reminders.filter((r) => r.status === "open");
  const resolved = reminders.filter((r) => r.status === "resolved");

  const renderRow = (r: Tables<"reminders">) => (
    <div key={r.id} className="rounded-md border px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{r.title}</p>
            <Badge variant={r.status === "resolved" ? "success" : "warning"}>
              {r.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            <Link
              href={`/admin/employees/${r.employee_id}`}
              className="hover:underline"
            >
              {nameById.get(r.employee_id) ?? "Unknown employee"}
            </Link>{" "}
            · {new Date(r.created_at).toLocaleString()}
          </p>
          {r.details ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {r.details}
            </p>
          ) : null}
          {r.status === "resolved" && r.resolution_note ? (
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
              Resolution: {r.resolution_note}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          {r.status === "open" ? (
            <ReminderResolveControls id={r.id} />
          ) : (
            <ReminderReopenButton id={r.id} />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reminders / Blockers
        </h1>
        <p className="text-muted-foreground">
          Items raised by employees that need your attention.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open</CardTitle>
          <CardDescription>{open.length} awaiting resolution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {open.length === 0 ? (
            <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
              No open reminders.
            </div>
          ) : (
            open.map(renderRow)
          )}
        </CardContent>
      </Card>

      {resolved.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Resolved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.map(renderRow)}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
