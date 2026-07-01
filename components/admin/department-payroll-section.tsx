import Link from "next/link";

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
import type { DepartmentPayrollGroup } from "@/lib/payroll/department-payroll";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DepartmentPayrollSection({
  group,
  monthStart,
}: {
  group: DepartmentPayrollGroup;
  monthStart: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{group.name}</CardTitle>
          <CardDescription>
            {group.employeeCount} employee{group.employeeCount === 1 ? "" : "s"}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-6 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Net salary to pay</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(group.totalNet)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total expense</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(group.totalExpense)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead className="text-right">Attendance salary</TableHead>
              <TableHead className="text-right">Net salary to pay</TableHead>
              <TableHead className="text-right">Total expense</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.employees.map(({ employee, payroll, employeeExpense }) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <Link
                    href={`/admin/attendance/${employee.id}?month=${monthStart}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {employee.full_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {employee.job_designation || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(payroll.calculated_salary)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(payroll.net_salary)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(employeeExpense)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
