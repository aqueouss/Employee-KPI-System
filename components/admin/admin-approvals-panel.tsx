"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { AdminTaskListItem } from "@/components/admin/admin-task-list-item";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

export function AdminApprovalsPanel({
  tasks: initialTasks,
  nameById,
}: {
  tasks: Tables<"tasks">[];
  nameById: Record<string, string>;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const employeeOrderRef = useRef(
    [...new Set(initialTasks.map((task) => task.employee_id))],
  );

  const byEmployee = useMemo(() => {
    const map = new Map<string, Tables<"tasks">[]>();
    for (const task of tasks) {
      const list = map.get(task.employee_id) ?? [];
      list.push(task);
      map.set(task.employee_id, list);
    }
    return map;
  }, [tasks]);

  const handleReviewed = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nothing awaiting approval. You&apos;re all caught up.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {employeeOrderRef.current
        .map((employeeId) => {
          const employeeTasks = byEmployee.get(employeeId);
          if (!employeeTasks?.length) return null;

          return (
            <Card key={employeeId}>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link
                    href={`/admin/employees/${employeeId}`}
                    className="hover:underline"
                  >
                    {nameById[employeeId] ?? "Unknown employee"}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {employeeTasks.length} task
                  {employeeTasks.length === 1 ? "" : "s"} awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <div className="divide-y divide-border/60">
                  {employeeTasks.map((task) => (
                    <AdminTaskListItem
                      key={task.id}
                      task={task}
                      onReviewed={handleReviewed}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
        .filter(Boolean)}
    </>
  );
}
