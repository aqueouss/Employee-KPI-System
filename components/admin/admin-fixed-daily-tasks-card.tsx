"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  createFixedDailyTaskAction,
  deleteFixedDailyTaskAction,
  updateFixedDailyTaskAction,
} from "@/actions/fixed-daily-task.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MAX_FIXED_DAILY_TASKS } from "@/lib/validators/fixed-daily-task.schema";

type FixedDailyTask = { id: string; title: string };

export function AdminFixedDailyTasksCard({
  employeeId,
  tasks,
}: {
  employeeId: string;
  tasks: FixedDailyTask[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");

  const atLimit = tasks.length >= MAX_FIXED_DAILY_TASKS;

  const run = (
    fd: FormData,
    action: typeof createFixedDailyTaskAction,
  ) => {
    setError(null);
    startTransition(async () => {
      const res = await action({}, fd);
      if (res.error) setError(res.error);
    });
  };

  const handleDelete = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("employee_id", employeeId);
    run(fd, deleteFixedDailyTaskAction);
  };

  const handleSaveEdit = (id: string) => {
    const title = editValue.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("employee_id", employeeId);
    fd.set("title", title);
    run(fd, updateFixedDailyTaskAction);
    setEditingId(null);
  };

  const handleCreate = () => {
    const title = newValue.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    fd.set("title", title);
    run(fd, createFixedDailyTaskAction);
    setNewValue("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fixed daily tasks</CardTitle>
            <CardDescription>
              Auto-added when attendance is present, late, half day, or short leave.
            </CardDescription>
          </div>
          <span className="text-xs text-muted-foreground">
            {tasks.length}/{MAX_FIXED_DAILY_TASKS}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No fixed tasks yet. Add up to {MAX_FIXED_DAILY_TASKS} below.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                {editingId === task.id ? (
                  <>
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      maxLength={200}
                      autoFocus
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex min-h-[4.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      aria-label="Save"
                      disabled={isPending}
                      onClick={() => handleSaveEdit(task.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      aria-label="Cancel"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 whitespace-pre-wrap text-sm">
                      {task.title}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      aria-label="Edit fixed task"
                      onClick={() => {
                        setEditingId(task.id);
                        setEditValue(task.title);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-destructive"
                      aria-label="Delete fixed task"
                      disabled={isPending}
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <textarea
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={
              atLimit
                ? `Limit of ${MAX_FIXED_DAILY_TASKS} reached`
                : "Add a fixed daily task..."
            }
            maxLength={200}
            disabled={atLimit || isPending}
            rows={3}
            className="flex min-h-[4.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-1"
          />
          <Button
            type="button"
            disabled={atLimit || isPending || newValue.trim() === ""}
            onClick={handleCreate}
            className="shrink-0"
          >
            <Plus className="mr-1 h-4 w-4" />
            Save
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
