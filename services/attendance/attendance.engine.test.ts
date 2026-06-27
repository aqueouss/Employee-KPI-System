import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyWeeklySundayRules,
  computeLeaveBalanceForMonth,
  computeSalarySummary,
  countWeekAbsences,
  overtimeHoursToPaidLeave,
  sundaysRequiringAutoAbsent,
} from "./attendance.engine.ts";

test("computeLeaveBalanceForMonth: carries unused paid leave forward", () => {
  const getBase = () => ({
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  });
  const may = computeLeaveBalanceForMonth([], "2026-05-01", getBase);
  assert.equal(may.paid_leave_remaining, 1);

  const june = computeLeaveBalanceForMonth([], "2026-06-01", getBase, {
    balanceMonths: ["2026-05-01"],
  });
  assert.equal(june.paid_leave_carried_forward, 1);
  assert.equal(june.paid_leave, 2);
  assert.equal(june.paid_leave_remaining, 2);
});

test("computeLeaveBalanceForMonth: default allowances and usage", () => {
  const records = [
    { attendance_date: "2026-06-02", status: "paid_leave" as const },
    { attendance_date: "2026-06-03", status: "late" as const },
    { attendance_date: "2026-06-04", status: "short_leave" as const, short_leave_type: "late_arrival" as const },
  ];
  const b = computeLeaveBalanceForMonth(records, "2026-06-01", () => ({
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }));
  assert.equal(b.paid_leave_used, 1);
  assert.equal(b.short_leave_used, 1);
  assert.equal(b.late_used, 1);
  assert.equal(b.late_remaining, 3);
});

test("computeLeaveBalanceForMonth: excess lates become half-day penalties", () => {
  const records = Array.from({ length: 6 }, (_, i) => ({
    attendance_date: `2026-06-${String(i + 2).padStart(2, "0")}`,
    status: "late" as const,
  }));
  const b = computeLeaveBalanceForMonth(records, "2026-06-01", () => ({
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }));
  assert.equal(b.late_used, 4);
  assert.equal(b.penalty_half_days, 2);
  assert.equal(b.half_day_used, 2);
});
test("overtimeHoursToPaidLeave: 8h equals 1 paid leave day", () => {
  assert.equal(overtimeHoursToPaidLeave(8), 1);
  assert.equal(overtimeHoursToPaidLeave(4), 0.5);
  assert.equal(overtimeHoursToPaidLeave(0), 0);
});

test("computeLeaveBalanceForMonth: overtime adds to paid leave", () => {
  const b = computeLeaveBalanceForMonth([], "2026-06-01", () => ({
    paid_leave: 1,
    overtime_hours: 8,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }));
  assert.equal(b.overtime_paid_leave_credit, 1);
  assert.equal(b.paid_leave, 2);
  assert.equal(b.paid_leave_remaining, 2);
});

test("countWeekAbsences: counts Mon–Sat absences only", () => {
  const records = [
    { attendance_date: "2026-06-01", status: "absent" as const },
    { attendance_date: "2026-06-02", status: "absent" as const },
    { attendance_date: "2026-06-03", status: "paid_leave" as const },
    { attendance_date: "2026-06-07", status: "absent" as const }, // Sun — ignored
  ];
  assert.equal(countWeekAbsences(records, "2026-06-01"), 2);
});

test("sundaysRequiringAutoAbsent: >2 absences triggers Sunday", () => {
  const records = [
    { attendance_date: "2026-06-01", status: "absent" as const },
    { attendance_date: "2026-06-02", status: "absent" as const },
    { attendance_date: "2026-06-03", status: "absent" as const },
  ];
  assert.deepEqual(sundaysRequiringAutoAbsent(records), ["2026-06-07"]);
});

test("applyWeeklySundayRules: adds auto absent on Sunday", () => {
  const records = [
    { attendance_date: "2026-06-01", status: "absent" as const },
    { attendance_date: "2026-06-02", status: "absent" as const },
    { attendance_date: "2026-06-03", status: "absent" as const },
  ];
  const merged = applyWeeklySundayRules(records);
  const sunday = merged.find((r) => r.attendance_date === "2026-06-07");
  assert.ok(sunday);
  assert.equal(sunday?.status, "absent");
  assert.equal(sunday?.is_auto_generated, true);
});

test("computeSalarySummary: salaried days deduct absents and extra half days", () => {
  const records = [
    { attendance_date: "2026-06-02", status: "absent" as const },
    { attendance_date: "2026-06-03", status: "half_day" as const },
    { attendance_date: "2026-06-04", status: "half_day" as const },
  ];
  const s = computeSalarySummary(records, "2026-06-01", {
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }, 30000);
  assert.ok(s.total_working_days >= 25);
  assert.equal(s.absent_days, 1);
  assert.equal(s.extra_half_days, 1);
  assert.ok(s.salaried_days < s.total_working_days);
  assert.ok(s.calculated_salary !== null && s.calculated_salary < 30000);
});
