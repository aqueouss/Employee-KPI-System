"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { createTaskAction, type TaskActionState } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import type { TaskPeriod } from "@/lib/utils/dates";

const initialState: TaskActionState = {};

export function TaskCreateForm({
  taskDate,
  period = "daily",
  placeholder = "Add a task for this day...",
}: {
  taskDate: string;
  period?: Exclude<TaskPeriod, "custom">;
  placeholder?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createTaskAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2"
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
        e.preventDefault();
      }}
    >
      <input type="hidden" name="task_date" value={taskDate} />
      <input type="hidden" name="period" value={period} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          name="title"
          placeholder={placeholder}
          required
          maxLength={200}
          autoComplete="off"
          rows={3}
          className="flex min-h-[5.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-1"
        />
        <Button type="submit" disabled={isPending} className="shrink-0">
          <Plus className="mr-1 h-4 w-4" />
          {isPending ? "Adding..." : "Add"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
