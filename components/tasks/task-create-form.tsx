"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { createTaskAction, type TaskActionState } from "@/actions/task.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: TaskActionState = {};

export function TaskCreateForm({
  taskDate,
  period = "daily",
  placeholder = "Add a task for this day...",
}: {
  taskDate: string;
  period?: "daily" | "weekly" | "monthly" | "quarterly";
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
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="task_date" value={taskDate} />
      <input type="hidden" name="period" value={period} />
      <div className="flex gap-2">
        <Input
          name="title"
          placeholder={placeholder}
          required
          maxLength={200}
          autoComplete="off"
        />
        <Button type="submit" disabled={isPending}>
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
