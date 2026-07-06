import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyWeeklySundayRules,
  computeLeaveBalanceForMonth,
  computePayrollSummary,
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

test("computeLeaveBalanceForMonth: late + half day counts both allowances", () => {
  const records = [
    { attendance_date: "2026-06-02", status: "late_half_day" as const },
  ];
  const b = computeLeaveBalanceForMonth(records, "2026-06-01", () => ({
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }));
  assert.equal(b.late_used, 1);
  assert.equal(b.half_day_used, 1);
});

test("computeLeaveBalanceForMonth: late + short leave counts both allowances", () => {
  const records = [
    {
      attendance_date: "2026-06-02",
      status: "late_short_leave" as const,
      short_leave_type: "late_arrival" as const,
    },
  ];
  const b = computeLeaveBalanceForMonth(records, "2026-06-01", () => ({
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }));
  assert.equal(b.late_used, 1);
  assert.equal(b.short_leave_used, 1);
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

test("computeSalarySummary: absent marked days earn no credit", () => {
  const records = [
    { attendance_date: "2026-06-01", status: "present" as const },
    { attendance_date: "2026-06-02", status: "absent" as const },
    { attendance_date: "2026-06-03", status: "present" as const },
  ];
  const s = computeSalarySummary(
    records,
    "2026-06-01",
    {
      paid_leave: 1,
      overtime_hours: 0,
      half_day: 1,
      short_leave: 1,
      late: 4,
    },
    30000,
    { asOfDate: "2026-06-30" },
  );
  assert.equal(s.total_working_days, 26);
  assert.equal(s.total_calendar_days, 30);
  assert.equal(s.month_calendar_days, 30);
  assert.equal(s.absent_days, 1);
  assert.equal(s.salaried_days, 2);
  assert.equal(s.calculated_salary, 2000);
});

test("computeSalarySummary: zero salary for months before hire date", () => {
  const s = computeSalarySummary(
    [],
    "2026-05-01",
    {
      paid_leave: 1,
      overtime_hours: 0,
      half_day: 1,
      short_leave: 1,
      late: 4,
    },
    36000,
    { hireDate: "2026-06-01", asOfDate: "2026-06-30" },
  );
  assert.equal(s.total_calendar_days, 0);
  assert.equal(s.salaried_days, 0);
  assert.equal(s.calculated_salary, 0);
});

test("computeSalarySummary: zero salary for future months", () => {
  const s = computeSalarySummary(
    [],
    "2026-07-01",
    {
      paid_leave: 1,
      overtime_hours: 0,
      half_day: 1,
      short_leave: 1,
      late: 4,
    },
    36000,
    { hireDate: "2026-06-01", asOfDate: "2026-06-30" },
  );
  assert.equal(s.total_calendar_days, 0);
  assert.equal(s.salaried_days, 0);
  assert.equal(s.calculated_salary, 0);
});

test("computeSalarySummary: prorates for mid-month hire with marked attendance", () => {
  const records = Array.from({ length: 21 }, (_, i) => ({
    attendance_date: `2026-06-${String(i + 10).padStart(2, "0")}`,
    status: "present" as const,
  }));
  const s = computeSalarySummary(
    records,
    "2026-06-01",
    {
      paid_leave: 1,
      overtime_hours: 0,
      half_day: 1,
      short_leave: 1,
      late: 4,
    },
    36000,
    { hireDate: "2026-06-10", asOfDate: "2026-06-30" },
  );
  assert.equal(s.total_calendar_days, 21);
  assert.equal(s.month_calendar_days, 30);
  assert.equal(s.salaried_days, 21);
  assert.equal(s.calculated_salary, 25200);
});

test("computeSalarySummary: unmarked eligible days are not paid", () => {
  const records = [
    { attendance_date: "2026-06-10", status: "present" as const },
    { attendance_date: "2026-06-11", status: "present" as const },
  ];
  const s = computeSalarySummary(
    records,
    "2026-06-01",
    {
      paid_leave: 1,
      overtime_hours: 0,
      half_day: 1,
      short_leave: 1,
      late: 4,
    },
    36000,
    { hireDate: "2026-06-10", asOfDate: "2026-06-30" },
  );
  assert.equal(s.total_calendar_days, 21);
  assert.equal(s.salaried_days, 5);
  assert.equal(s.calculated_salary, 6000);
});

test("computeSalarySummary: unmarked Sundays only through previous week", () => {
  const s = computeSalarySummary([], "2026-06-01", {
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }, 30000, { asOfDate: "2026-06-15" });
  assert.equal(s.salaried_days, 2);
  assert.equal(s.calculated_salary, 2000);
});

test("computeSalarySummary: unmarked Sundays in eligible period are paid", () => {
  const records = Array.from({ length: 30 }, (_, i) => {
    const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
    return { attendance_date: date, status: "present" as const };
  }).filter((r) => new Date(`${r.attendance_date}T00:00:00Z`).getUTCDay() !== 0);

  const s = computeSalarySummary(records, "2026-06-01", {
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }, 30000, { asOfDate: "2026-06-30" });

  assert.equal(s.salaried_days, 30);
  assert.equal(s.calculated_salary, 30000);
});

test("computeSalarySummary: extra half days consume paid leave before salary deduction", () => {
  const records = [
    { attendance_date: "2026-06-02", status: "half_day" as const },
    { attendance_date: "2026-06-03", status: "half_day" as const },
    { attendance_date: "2026-06-04", status: "half_day" as const },
  ];
  const s = computeSalarySummary(
    records,
    "2026-06-01",
    {
      paid_leave: 1,
      overtime_hours: 0,
      half_day: 1,
      short_leave: 1,
      late: 4,
    },
    30000,
    { carryForward: 1, asOfDate: "2026-06-30" },
  );
  assert.equal(s.extra_half_days, 0);
  assert.equal(s.salaried_days, 3);
});

test("computeSalarySummary: salary deducts only uncovered extra half days", () => {
  const records = [
    { attendance_date: "2026-06-02", status: "half_day" as const },
    { attendance_date: "2026-06-03", status: "half_day" as const },
    { attendance_date: "2026-06-04", status: "half_day" as const },
    { attendance_date: "2026-06-05", status: "half_day" as const },
  ];
  const s = computeSalarySummary(records, "2026-06-01", {
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }, 30000, { asOfDate: "2026-06-30" });
  assert.equal(s.extra_half_days, 1);
  assert.equal(s.salaried_days, 3.5);
});

test("computeLeaveBalanceForMonth: extra half days reduce paid leave remaining", () => {
  const records = [
    { attendance_date: "2026-06-02", status: "half_day" as const },
    { attendance_date: "2026-06-03", status: "half_day" as const },
    { attendance_date: "2026-06-04", status: "half_day" as const },
  ];
  const b = computeLeaveBalanceForMonth(records, "2026-06-01", () => ({
    paid_leave: 1,
    overtime_hours: 0,
    half_day: 1,
    short_leave: 1,
    late: 4,
  }));
  assert.equal(b.paid_leave_remaining, 0);
});

test("computePayrollSummary: net salary includes adjustments", () => {
  const salary = {
    total_working_days: 26,
    total_calendar_days: 30,
    month_calendar_days: 30,
    absent_days: 0,
    extra_half_days: 0,
    salaried_days: 30,
    monthly_salary: 30000,
    daily_rate: 1000,
    calculated_salary: 30000,
  };
  const payroll = computePayrollSummary(salary, {
    incentives: 5000,
    conveyance: 2000,
    advance_deduction: 3000,
  });
  assert.equal(payroll.gross_salary, 37000);
  assert.equal(payroll.net_salary, 34000);
});

test("computePayrollSummary: returns null when no salary and no adjustments", () => {
  const salary = {
    total_working_days: 26,
    total_calendar_days: 30,
    month_calendar_days: 30,
    absent_days: 0,
    extra_half_days: 0,
    salaried_days: 30,
    monthly_salary: null,
    daily_rate: null,
    calculated_salary: null,
  };
  const payroll = computePayrollSummary(salary, {
    incentives: 0,
    conveyance: 0,
    advance_deduction: 0,
  });
  assert.equal(payroll.gross_salary, null);
  assert.equal(payroll.net_salary, null);
});
