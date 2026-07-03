import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { AdminLeaveRequestRow } from "@/components/leave/admin-leave-request-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export default async function AdminLeaveRequestsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("leave_requests")
    .select("*")
    .order("status", { ascending: true })
    .order("leave_date", { ascending: true })
    .order("created_at", { ascending: false });

  const requests = (data ?? []) as Tables<"leave_requests">[];

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name");
  const nameById = new Map((profileData ?? []).map((p) => [p.id, p.full_name]));

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leave requests</h1>
        <p className="text-muted-foreground">
          Approve or reject employee leave applications. Approved leaves update
          attendance automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <CardDescription>{pending.length} awaiting review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
              No pending leave requests.
            </div>
          ) : (
            pending.map((request) => (
              <AdminLeaveRequestRow
                key={request.id}
                request={request}
                employeeName={nameById.get(request.employee_id) ?? "Unknown"}
              />
            ))
          )}
        </CardContent>
      </Card>

      {reviewed.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Reviewed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewed.map((request) => (
              <div key={request.id} className="rounded-md border px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {request.leave_date}{" "}
                    <span className="text-muted-foreground">
                      ·{" "}
                      <Link
                        href={`/admin/employees/${request.employee_id}`}
                        className="hover:underline"
                      >
                        {nameById.get(request.employee_id) ?? "Unknown"}
                      </Link>
                    </span>
                  </p>
                  <Badge
                    variant={
                      request.status === "approved" ? "success" : "destructive"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
                {request.review_note ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.review_note}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
