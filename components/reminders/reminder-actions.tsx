"use client";

import { useState, useTransition } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";

import {
  deleteReminderAction,
  reopenReminderAction,
  resolveReminderAction,
} from "@/actions/reminder.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReminderDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-destructive"
      disabled={isPending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", id);
        startTransition(async () => {
          await deleteReminderAction({}, fd);
        });
      }}
    >
      <Trash2 className="mr-1 h-4 w-4" />
      Delete
    </Button>
  );
}

export function ReminderResolveControls({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Resolution note (optional)"
        maxLength={500}
        className="h-9 sm:w-64"
      />
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() => {
          const fd = new FormData();
          fd.set("id", id);
          fd.set("note", note);
          startTransition(async () => {
            await resolveReminderAction({}, fd);
          });
        }}
      >
        <Check className="mr-1 h-4 w-4" />
        Resolve
      </Button>
    </div>
  );
}

export function ReminderReopenButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", id);
        startTransition(async () => {
          await reopenReminderAction({}, fd);
        });
      }}
    >
      <RotateCcw className="mr-1 h-4 w-4" />
      Reopen
    </Button>
  );
}
