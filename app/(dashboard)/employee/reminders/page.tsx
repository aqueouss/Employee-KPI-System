import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ReminderDeleteButton } from "@/components/reminders/reminder-actions";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function EmployeeRemindersPage() {
  const profile = await requireRole(["admin", "employee"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("reminders")
    .select("*")
    .eq("employee_id", profile.id)
    .order("created_at", { ascending: false });

  const reminders = (data ?? []) as Tables<"reminders">[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reminders / Blockers
        </h1>
        <p className="text-muted-foreground">
          Raise blockers or reminders for the admin to act on.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New reminder</CardTitle>
          <CardDescription>This is sent to the admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReminderForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminders.length === 0 ? (
            <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
              No reminders yet.
            </div>
          ) : (
            reminders.map((r) => (
              <div key={r.id} className="rounded-md border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{r.title}</p>
                      <Badge
                        variant={
                          r.status === "resolved" ? "success" : "warning"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    {r.details ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {r.details}
                      </p>
                    ) : null}
                    {r.status === "resolved" && r.resolution_note ? (
                      <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                        Admin: {r.resolution_note}
                      </p>
                    ) : null}
                  </div>
                  {r.status === "open" ? (
                    <ReminderDeleteButton id={r.id} />
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
