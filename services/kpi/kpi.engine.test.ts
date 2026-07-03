import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculateCompletionPct,
  computeDailyKpi,
  determineKpiFlag,
} from "./kpi.engine.ts";

const rules = { green_threshold: 90, yellow_threshold: 70 };

test("calculateCompletionPct: zero tasks returns 0", () => {
  assert.equal(calculateCompletionPct(0, 0), 0);
});

test("calculateCompletionPct: full completion is 100", () => {
  assert.equal(calculateCompletionPct(10, 10), 100);
});

test("calculateCompletionPct: rounds to two decimals", () => {
  assert.equal(calculateCompletionPct(3, 1), 33.33);
  assert.equal(calculateCompletionPct(3, 2), 66.67);
});

test("calculateCompletionPct: clamps completed to total", () => {
  assert.equal(calculateCompletionPct(5, 9), 100);
});

test("determineKpiFlag: no tasks => no_tasks", () => {
  assert.equal(determineKpiFlag(0, 0, rules), "no_tasks");
});

test("determineKpiFlag: no tasks + present => red", () => {
  assert.equal(
    determineKpiFlag(0, 0, rules, { attendanceStatus: "present" }),
    "red",
  );
});

test("determineKpiFlag: no tasks + half day => no_tasks", () => {
  assert.equal(
    determineKpiFlag(0, 0, rules, { attendanceStatus: "half_day" }),
    "no_tasks",
  );
});

test("determineKpiFlag: no tasks + short leave => no_tasks", () => {
  assert.equal(
    determineKpiFlag(0, 0, rules, { attendanceStatus: "short_leave" }),
    "no_tasks",
  );
});

test("determineKpiFlag: green at boundary (90)", () => {
  assert.equal(determineKpiFlag(90, 10, rules), "green");
});

test("determineKpiFlag: yellow at boundary (70)", () => {
  assert.equal(determineKpiFlag(70, 10, rules), "yellow");
  assert.equal(determineKpiFlag(89.99, 10, rules), "yellow");
});

test("determineKpiFlag: red below yellow threshold", () => {
  assert.equal(determineKpiFlag(69.99, 10, rules), "red");
  assert.equal(determineKpiFlag(0, 10, rules), "red");
});

test("computeDailyKpi: green scenario (9/10)", () => {
  const r = computeDailyKpi(10, 9, rules);
  assert.deepEqual(r, {
    totalTasks: 10,
    completedTasks: 9,
    completionPct: 90,
    flag: "green",
  });
});

test("computeDailyKpi: yellow scenario (8/10)", () => {
  const r = computeDailyKpi(10, 8, rules);
  assert.equal(r.completionPct, 80);
  assert.equal(r.flag, "yellow");
});

test("computeDailyKpi: red scenario (6/10)", () => {
  const r = computeDailyKpi(10, 6, rules);
  assert.equal(r.completionPct, 60);
  assert.equal(r.flag, "red");
});

test("computeDailyKpi: no_tasks scenario (0/0)", () => {
  const r = computeDailyKpi(0, 0, rules);
  assert.equal(r.flag, "no_tasks");
  assert.equal(r.completionPct, 0);
});

test("computeDailyKpi: present with no tasks => red", () => {
  const r = computeDailyKpi(0, 0, rules, { attendanceStatus: "present" });
  assert.equal(r.flag, "red");
});

test("computeDailyKpi: respects custom thresholds", () => {
  const strict = { green_threshold: 95, yellow_threshold: 80 };
  assert.equal(computeDailyKpi(10, 9, strict).flag, "yellow");
  assert.equal(computeDailyKpi(10, 10, strict).flag, "green");
});
