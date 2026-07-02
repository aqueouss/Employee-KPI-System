import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  groupEmployeesByDepartment,
  type DepartmentEmployee,
} from "@/lib/departments/department-utils";
import { DepartmentOverviewCard } from "@/components/admin/department-overview-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default async function AdminDepartmentsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, job_designation, department, is_active, role",
    )
    .order("full_name");

  const employees = (data ?? []) as DepartmentEmployee[];
  const departments = groupEmployeesByDepartment(employees);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to overview
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
        <p className="text-muted-foreground">
          Browse teams and open each department&apos;s performance view.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((department) => (
          <DepartmentOverviewCard key={department.slug} department={department} />
        ))}
      </div>

      {departments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No employees found.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
