import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { AddEmployeeForm } from "@/components/admin/add-employee-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewEmployeePage() {
  await requireRole(["admin"]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to employees
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
        <p className="text-muted-foreground">
          Create a new account. The user is confirmed immediately and can sign
          in right away.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New account</CardTitle>
          <CardDescription>
            Requires the service role key to be configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddEmployeeForm />
        </CardContent>
      </Card>
    </div>
  );
}
