import assert from "node:assert/strict";
import { test } from "node:test";

import {
  evaluateMonthlyWarning,
  evaluateTerminationReview,
  monthKeyForDate,
  reconcileMonthlyWarningState,
  terminationWindowStart,
} from "./warning.engine.ts";

test("monthKeyForDate returns first of month", () => {
  assert.equal(monthKeyForDate("2026-06-15"), "2026-06-01");
  assert.equal(monthKeyForDate("2026-12-31"), "2026-12-01");
});

test("evaluateMonthlyWarning: issues at threshold", () => {
  const r = evaluateMonthlyWarning(
    ["2026-06-10", "2026-06-03", "2026-06-20"],
    3,
    false,
  );
  assert.equal(r.shouldIssue, true);
  assert.equal(r.redFlagCount, 3);
  assert.deepEqual(r.redFlagDates, ["2026-06-03", "2026-06-10", "2026-06-20"]);
});

test("evaluateMonthlyWarning: below threshold does not issue", () => {
  const r = evaluateMonthlyWarning(["2026-06-10", "2026-06-03"], 3, false);
  assert.equal(r.shouldIssue, false);
});

test("evaluateMonthlyWarning: idempotent when warning exists", () => {
  const r = evaluateMonthlyWarning(
    ["2026-06-10", "2026-06-03", "2026-06-20", "2026-06-25"],
    3,
    true,
  );
  assert.equal(r.shouldIssue, false);
  assert.equal(r.redFlagCount, 4);
});

test("reconcileMonthlyWarningState: revokes active warning below threshold", () => {
  const r = reconcileMonthlyWarningState(
    ["2026-06-10", "2026-06-03"],
    3,
    { status: "active" },
  );
  assert.equal(r.shouldRevoke, true);
  assert.equal(r.shouldIssue, false);
});

test("reconcileMonthlyWarningState: keeps acknowledged warning below threshold", () => {
  const r = reconcileMonthlyWarningState(
    ["2026-06-10", "2026-06-03"],
    3,
    { status: "acknowledged" },
  );
  assert.equal(r.shouldRevoke, false);
  assert.equal(r.shouldUpdate, false);
});

test("reconcileMonthlyWarningState: updates when still above threshold", () => {
  const r = reconcileMonthlyWarningState(
    ["2026-06-10", "2026-06-03", "2026-06-20"],
    3,
    { status: "active" },
  );
  assert.equal(r.shouldRevoke, false);
  assert.equal(r.shouldIssue, false);
  assert.equal(r.shouldUpdate, true);
});

test("terminationWindowStart computes inclusive lower bound", () => {
  // 365-day window ending 2026-06-15 starts 365 days earlier inclusive
  assert.equal(terminationWindowStart("2026-06-15", 365), "2025-06-16");
  assert.equal(terminationWindowStart("2026-06-15", 1), "2026-06-15");
});

test("evaluateTerminationReview: flags at threshold", () => {
  const r = evaluateTerminationReview(
    ["2026-01-01", "2026-03-01", "2026-06-01"],
    3,
    false,
  );
  assert.equal(r.shouldFlag, true);
  assert.equal(r.warningCount, 3);
});

test("evaluateTerminationReview: below threshold does not flag", () => {
  const r = evaluateTerminationReview(["2026-01-01", "2026-03-01"], 3, false);
  assert.equal(r.shouldFlag, false);
});

test("evaluateTerminationReview: idempotent when review open", () => {
  const r = evaluateTerminationReview(
    ["2026-01-01", "2026-03-01", "2026-06-01"],
    3,
    true,
  );
  assert.equal(r.shouldFlag, false);
});
