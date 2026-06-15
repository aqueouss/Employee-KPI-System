import Link from "next/link";
import { UserPlus } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { EmployeeActiveToggle } from "@/components/admin/employee-active-toggle";
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
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {employee.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.is_active ? "success" : "destructive"}
                      >
                        {employee.is_active ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(employee.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {employee.id === admin.id ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <EmployeeActiveToggle
                          employeeId={employee.id}
                          isActive={employee.is_active}
                        />
                      )}
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
