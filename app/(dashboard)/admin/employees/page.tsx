import Link from "next/link";
import { UserPlus } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { EmployeeRowActions } from "@/components/admin/employee-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminEmployeesPage() {
  const admin = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const employees = (data ?? []) as Tables<"profiles">[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            {employees.length} {employees.length === 1 ? "person" : "people"} in
            the system.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/employees/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add employee
          </Link>
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Failed to load employees: {error.message}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>All registered accounts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/employees/${employee.id}`}
                        className="hover:underline"
                      >
                        {employee.full_name}
                      </Link>
                      {employee.id === admin.id ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (you)
                        </span>
                      ) : null}
                      <p className="mt-0.5 text-xs text-muted-foreground lg:hidden">
                        {employee.email}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {employee.department || "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {employee.email}
                    </TableCell>
                    <TableCell>
                      {employee.role === "admin" ? (
                        <Badge variant="default">Admin</Badge>
                      ) : employee.kpi_tracked === false ? (
                        <Badge variant="outline">Payroll</Badge>
                      ) : (
                        <Badge variant="secondary">KPI</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.is_active ? "success" : "destructive"}
                        className="text-[11px]"
                      >
                        {employee.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(employee.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <EmployeeRowActions
                        employeeId={employee.id}
                        fullName={employee.full_name}
                        isActive={employee.is_active}
                        kpiTracked={employee.kpi_tracked !== false}
                        isAdmin={employee.role === "admin"}
                        isSelf={employee.id === admin.id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
