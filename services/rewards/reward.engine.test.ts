import assert from "node:assert/strict";
import { test } from "node:test";

import { computeGreenStreak, evaluateReward } from "./reward.engine.ts";
import type { KpiFlag } from "../../types/domain.ts";

function buildGreenRange(start: string, days: number): Map<string, KpiFlag> {
  const map = new Map<string, KpiFlag>();
  const d = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < days; i++) {
    map.set(d.toISOString().slice(0, 10), "green");
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return map;
}

test("computeGreenStreak: counts consecutive greens ending asOf", () => {
  const map = buildGreenRange("2026-05-01", 30); // through 2026-05-30
  const r = computeGreenStreak(map, "2026-05-30", true);
  assert.equal(r.length, 30);
  assert.equal(r.startDate, "2026-05-01");
  assert.equal(r.endDate, "2026-05-30");
});

test("computeGreenStreak: breaks on non-green day", () => {
  const map = buildGreenRange("2026-05-01", 30);
  map.set("2026-05-20", "red");
  const r = computeGreenStreak(map, "2026-05-30", true);
  assert.equal(r.length, 10); // 21..30
  assert.equal(r.startDate, "2026-05-21");
});

test("computeGreenStreak: missing snapshot breaks streak", () => {
  const map = buildGreenRange("2026-05-01", 30);
  map.delete("2026-05-25");
  const r = computeGreenStreak(map, "2026-05-30", true);
  assert.equal(r.length, 5); // 26..30
});

test("computeGreenStreak: no_tasks breaks streak", () => {
  const map = buildGreenRange("2026-05-01", 30);
  map.set("2026-05-28", "no_tasks");
  const r = computeGreenStreak(map, "2026-05-30", true);
  assert.equal(r.length, 2); // 29..30
});

test("computeGreenStreak: zero when asOf is not green", () => {
  const map = buildGreenRange("2026-05-01", 10);
  map.set("2026-05-10", "yellow");
  const r = computeGreenStreak(map, "2026-05-10", true);
  assert.equal(r.length, 0);
  assert.equal(r.startDate, null);
});

test("computeGreenStreak: skips weekends when countWeekends false", () => {
  // Green only on weekdays; weekends absent. 2026-05-01 is a Friday.
  const map = new Map<string, KpiFlag>();
  const weekdays = [
    "2026-05-01", // Fri
    "2026-05-04", // Mon
    "2026-05-05", // Tue
  ];
  for (const d of weekdays) map.set(d, "green");
  const r = computeGreenStreak(map, "2026-05-05", false);
  assert.equal(r.length, 3);
  assert.equal(r.startDate, "2026-05-01");
});

test("evaluateReward: eligible at required length", () => {
  const map = buildGreenRange("2026-05-01", 30);
  const streak = computeGreenStreak(map, "2026-05-30", true);
  const r = evaluateReward(streak, 30, false);
  assert.equal(r.eligible, true);
});

test("evaluateReward: not eligible below required length", () => {
  const map = buildGreenRange("2026-05-01", 29);
  const streak = computeGreenStreak(map, "2026-05-29", true);
  const r = evaluateReward(streak, 30, false);
  assert.equal(r.eligible, false);
});

test("evaluateReward: idempotent when overlapping reward exists", () => {
  const map = buildGreenRange("2026-05-01", 30);
  const streak = computeGreenStreak(map, "2026-05-30", true);
  const r = evaluateReward(streak, 30, true);
  assert.equal(r.eligible, false);
});
