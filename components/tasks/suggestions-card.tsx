"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  addSuggestionToTodayAction,
  createSuggestionAction,
  deleteSuggestionAction,
  updateSuggestionAction,
} from "@/actions/suggestion.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MAX_SUGGESTIONS } from "@/lib/validators/suggestion.schema";

type Suggestion = { id: string; title: string };

export function SuggestionsCard({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");

  const atLimit = suggestions.length >= MAX_SUGGESTIONS;

  const run = (fd: FormData, action: typeof createSuggestionAction) => {
    setError(null);
    startTransition(async () => {
      const res = await action({}, fd);
      if (res.error) setError(res.error);
    });
  };

  const handleAddToToday = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    run(fd, addSuggestionToTodayAction);
  };

  const handleDelete = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    run(fd, deleteSuggestionAction);
  };

  const handleSaveEdit = (id: string) => {
    const title = editValue.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("title", title);
    run(fd, updateSuggestionAction);
    setEditingId(null);
  };

  const handleCreate = () => {
    const title = newValue.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("title", title);
    run(fd, createSuggestionAction);
    setNewValue("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quick-add suggestions</CardTitle>
            <CardDescription>
              Save tasks you do often and add them to today in one click.
            </CardDescription>
          </div>
          <span className="text-xs text-muted-foreground">
            {suggestions.length}/{MAX_SUGGESTIONS}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No suggestions yet. Add up to {MAX_SUGGESTIONS} below.
          </p>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                {editingId === s.id ? (
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
                      onClick={() => handleSaveEdit(s.id)}
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
                      {s.title}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={isPending}
                      onClick={() => handleAddToToday(s.id)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      aria-label="Edit suggestion"
                      onClick={() => {
                        setEditingId(s.id);
                        setEditValue(s.title);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-destructive"
                      aria-label="Delete suggestion"
                      disabled={isPending}
                      onClick={() => handleDelete(s.id)}
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
                ? `Limit of ${MAX_SUGGESTIONS} reached`
                : "Add a suggestion..."
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
