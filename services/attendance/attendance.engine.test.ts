import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyWeeklySundayLeaves,
  computeLeaveBalance,
  countWeekLeaves,
  sundaysRequiringAutoLeave,
} from "./attendance.engine.ts";

test("computeLeaveBalance: default allowances and usage", () => {
  const records = [
    { attendance_date: "2026-06-02", status: "paid_leave" as const },
    { attendance_date: "2026-06-03", status: "late" as const },
    { attendance_date: "2026-06-04", status: "short_leave" as const, short_leave_type: "late_arrival" as const },
  ];
  const b = computeLeaveBalance(records, "2026-06-01");
  assert.equal(b.paid_leave_used, 1);
  assert.equal(b.short_leave_used, 1);
  assert.equal(b.late_used, 1);
  assert.equal(b.late_remaining, 3);
});

test("computeLeaveBalance: excess lates become half-day penalties", () => {
  const records = Array.from({ length: 6 }, (_, i) => ({
    attendance_date: `2026-06-${String(i + 2).padStart(2, "0")}`,
    status: "late" as const,
  }));
  const b = computeLeaveBalance(records, "2026-06-01");
  assert.equal(b.late_used, 4);
  assert.equal(b.penalty_half_days, 2);
  assert.equal(b.half_day_used, 2);
});

test("countWeekLeaves: counts Mon–Sat leaves only", () => {
  const records = [
    { attendance_date: "2026-06-01", status: "paid_leave" as const }, // Mon
    { attendance_date: "2026-06-02", status: "half_day" as const },
    { attendance_date: "2026-06-03", status: "paid_leave" as const },
    { attendance_date: "2026-06-07", status: "paid_leave" as const }, // Sun — ignored
  ];
  assert.equal(countWeekLeaves(records, "2026-06-01"), 3);
});

test("sundaysRequiringAutoLeave: >2 leaves triggers Sunday", () => {
  const records = [
    { attendance_date: "2026-06-01", status: "paid_leave" as const },
    { attendance_date: "2026-06-02", status: "paid_leave" as const },
    { attendance_date: "2026-06-03", status: "short_leave" as const, short_leave_type: "early_departure" as const },
  ];
  assert.deepEqual(sundaysRequiringAutoLeave(records), ["2026-06-07"]);
});

test("applyWeeklySundayLeaves: adds auto sunday_leave", () => {
  const records = [
    { attendance_date: "2026-06-01", status: "paid_leave" as const },
    { attendance_date: "2026-06-02", status: "paid_leave" as const },
    { attendance_date: "2026-06-03", status: "half_day" as const },
  ];
  const merged = applyWeeklySundayLeaves(records);
  const sunday = merged.find((r) => r.attendance_date === "2026-06-07");
  assert.ok(sunday);
  assert.equal(sunday?.status, "sunday_leave");
  assert.equal(sunday?.is_auto_generated, true);
});
