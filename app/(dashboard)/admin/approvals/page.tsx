import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { AdminApprovalsPanel } from "@/components/admin/admin-approvals-panel";
import type { Tables } from "@/types/database.types";

export default async function AdminApprovalsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: taskData } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  const tasks = (taskData ?? []) as Tables<"tasks">[];

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name");
  const nameById = Object.fromEntries(
    (profileData ?? []).map((p) => [p.id, p.full_name]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Task Approvals
        </h1>
        <p className="text-muted-foreground">
          Review tasks employees marked as done, or approve pending tasks
          directly. You can approve anytime — even days later — and the KPI for
          that task&apos;s date will update. You can also revoke a previously
          approved task.
        </p>
      </div>

      <AdminApprovalsPanel tasks={tasks} nameById={nameById} />
    </div>
  );
}
