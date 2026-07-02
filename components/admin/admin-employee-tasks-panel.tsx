import { AdminTaskCreateForm } from "@/components/admin/admin-task-create-form";
import { AdminTaskListItem } from "@/components/admin/admin-task-list-item";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { partitionAdminEmployeeTasks } from "@/lib/tasks/admin-employee-task-sections";
import type { Tables } from "@/types/database.types";

export function AdminEmployeeTasksPanel({
  employeeId,
  today,
  tasks,
}: {
  employeeId: string;
  today: string;
  tasks: Tables<"tasks">[];
}) {
  const sections = partitionAdminEmployeeTasks(tasks, today);
  const hasTasks = sections.some((section) => section.tasks.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>
          Assign weekly tasks and review submissions. KPI updates when you
          approve daily tasks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AdminTaskCreateForm employeeId={employeeId} today={today} />

        {!hasTasks ? (
          <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
            No tasks yet.
          </div>
        ) : (
          sections.map((section) =>
            section.tasks.length === 0 ? null : (
              <div key={section.id} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
                  {section.tasks.map((task) => (
                    <AdminTaskListItem key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ),
          )
        )}
      </CardContent>
    </Card>
  );
}
