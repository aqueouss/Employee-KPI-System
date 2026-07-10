import assert from "node:assert/strict";
import test from "node:test";

import {
  isOverdueAdminWeeklyTask,
  isVisibleAdminWeeklyTask,
} from "@/lib/tasks/admin-weekly-task";

const adminWeekly = {
  period: "weekly" as const,
  created_by_admin: true,
  task_date: "2026-07-01",
  due_date: "2026-07-08",
};

test("isVisibleAdminWeeklyTask: pending tasks stay visible after due date", () => {
  assert.equal(
    isVisibleAdminWeeklyTask({ ...adminWeekly, status: "pending" }, "2026-07-10"),
    true,
  );
});

test("isVisibleAdminWeeklyTask: completed tasks hide after due date", () => {
  assert.equal(
    isVisibleAdminWeeklyTask(
      { ...adminWeekly, status: "completed" },
      "2026-07-10",
    ),
    false,
  );
});

test("isOverdueAdminWeeklyTask: flags unresolved tasks past deadline", () => {
  assert.equal(
    isOverdueAdminWeeklyTask({ ...adminWeekly, status: "pending" }, "2026-07-10"),
    true,
  );
  assert.equal(
    isOverdueAdminWeeklyTask({ ...adminWeekly, status: "pending" }, "2026-07-08"),
    false,
  );
});
