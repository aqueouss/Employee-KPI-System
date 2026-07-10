import assert from "node:assert/strict";
import { test } from "node:test";

import { weeklyIncompleteRedFlagDates } from "./weekly.engine.ts";

test("weeklyIncompleteRedFlagDates: one flag per overdue incomplete task", () => {
  const flags = weeklyIncompleteRedFlagDates(
    [
      { status: "completed", task_date: "2026-03-06", due_date: "2026-03-13" },
      { status: "completed", task_date: "2026-03-06", due_date: "2026-03-13" },
      { status: "completed", task_date: "2026-03-06", due_date: "2026-03-13" },
      { status: "completed", task_date: "2026-03-06", due_date: "2026-03-13" },
      { status: "pending", task_date: "2026-03-06", due_date: "2026-03-13" },
    ],
    "2026-03-13",
  );
  assert.equal(flags.length, 1);
  assert.equal(flags[0], "2026-03-06");
});

test("weeklyIncompleteRedFlagDates: ignores submitted tasks past deadline", () => {
  const flags = weeklyIncompleteRedFlagDates(
    [{ status: "submitted", task_date: "2026-03-06", due_date: "2026-03-13" }],
    "2026-03-20",
  );
  assert.deepEqual(flags, ["2026-03-06"]);
});

test("weeklyIncompleteRedFlagDates: ignores tasks before deadline", () => {
  const flags = weeklyIncompleteRedFlagDates(
    [{ status: "pending", task_date: "2026-03-06", due_date: "2026-03-13" }],
    "2026-03-10",
  );
  assert.deepEqual(flags, []);
});

test("weeklyIncompleteRedFlagDates: all complete yields none", () => {
  const flags = weeklyIncompleteRedFlagDates(
    [
      { status: "completed", task_date: "2026-03-06", due_date: "2026-03-13" },
      { status: "completed", task_date: "2026-03-06", due_date: "2026-03-13" },
    ],
    "2026-03-20",
  );
  assert.deepEqual(flags, []);
});
