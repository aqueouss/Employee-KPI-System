import assert from "node:assert/strict";
import test from "node:test";

import {
  isOverdueAdminWeeklyTask,
  isVisibleAdminWeeklyTaskForAdmin,
  isVisibleAdminWeeklyTaskForEmployee,
} from "@/lib/tasks/admin-weekly-task";

const adminWeekly = {
  period: "weekly" as const,
  created_by_admin: true,
  task_date: "2026-07-02",
  due_date: "2026-07-09",
};

test("isVisibleAdminWeeklyTaskForEmployee: hides pending tasks after due date", () => {
  assert.equal(
    isVisibleAdminWeeklyTaskForEmployee(
      { ...adminWeekly, status: "pending" },
      "2026-07-10",
    ),
    false,
  );
  assert.equal(
    isVisibleAdminWeeklyTaskForEmployee(
      { ...adminWeekly, status: "pending" },
      "2026-07-09",
    ),
    true,
  );
});

test("isVisibleAdminWeeklyTaskForAdmin: keeps pending tasks after due date", () => {
  assert.equal(
    isVisibleAdminWeeklyTaskForAdmin(
      { ...adminWeekly, status: "pending" },
      "2026-07-10",
    ),
    true,
  );
});

test("isOverdueAdminWeeklyTask: flags unresolved tasks past deadline", () => {
  assert.equal(
    isOverdueAdminWeeklyTask({ ...adminWeekly, status: "pending" }, "2026-07-10"),
    true,
  );
});
