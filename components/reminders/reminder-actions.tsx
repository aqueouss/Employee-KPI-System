"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, RotateCcw, Trash2, X } from "lucide-react";

import {
  deleteReminderAction,
  reopenReminderAction,
  resolveReminderAction,
  updateReminderAction,
} from "@/actions/reminder.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReminderEditControls({
  id,
  title,
  details,
}: {
  id: string;
  title: string;
  details: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDetails, setEditDetails] = useState(details ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("title", trimmedTitle);
    fd.set("details", editDetails);
    startTransition(async () => {
      const res = await updateReminderAction({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEditing(false);
    });
  };

  if (editing) {
    return (
      <div className="w-full space-y-2 sm:min-w-[280px]">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          maxLength={200}
          autoFocus
          className="h-9"
        />
        <textarea
          value={editDetails}
          onChange={(e) => setEditDetails(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Details (optional)"
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={isPending} onClick={save}>
            <Check className="mr-1 h-4 w-4" />
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(false);
              setEditTitle(title);
              setEditDetails(details ?? "");
              setError(null);
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => setEditing(true)}
    >
      <Pencil className="mr-1 h-4 w-4" />
      Edit
    </Button>
  );
}

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
