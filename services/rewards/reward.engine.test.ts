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
  const r = computeGreenStreak(map, "2026-05-30");
  assert.equal(r.length, 26); // 4 Sundays excluded
  assert.equal(r.startDate, "2026-05-01");
  assert.equal(r.endDate, "2026-05-30");
});

test("computeGreenStreak: breaks on non-green day", () => {
  const map = buildGreenRange("2026-05-01", 30);
  map.set("2026-05-20", "red");
  const r = computeGreenStreak(map, "2026-05-30");
  assert.equal(r.length, 9); // 21..30 minus Sunday 2026-05-24
  assert.equal(r.startDate, "2026-05-21");
});

test("computeGreenStreak: missing snapshot breaks streak", () => {
  const map = buildGreenRange("2026-05-01", 30);
  map.delete("2026-05-25");
  const r = computeGreenStreak(map, "2026-05-30");
  assert.equal(r.length, 5); // 26..30
});

test("computeGreenStreak: no_tasks breaks streak", () => {
  const map = buildGreenRange("2026-05-01", 30);
  map.set("2026-05-28", "no_tasks");
  const r = computeGreenStreak(map, "2026-05-30");
  assert.equal(r.length, 2); // 29..30
});

test("computeGreenStreak: zero when asOf is not green", () => {
  const map = buildGreenRange("2026-05-01", 10);
  map.set("2026-05-08", "yellow"); // Friday
  const r = computeGreenStreak(map, "2026-05-08");
  assert.equal(r.length, 0);
  assert.equal(r.startDate, null);
});

test("computeGreenStreak: skips Sundays only", () => {
  // 2026-05-02 is Saturday, 2026-05-03 is Sunday, 2026-05-04 is Monday.
  const map = new Map<string, KpiFlag>([
    ["2026-05-01", "green"], // Fri
    ["2026-05-02", "green"], // Sat — counts
    ["2026-05-04", "green"], // Mon — Sunday skipped
  ]);
  const r = computeGreenStreak(map, "2026-05-04");
  assert.equal(r.length, 3);
  assert.equal(r.startDate, "2026-05-01");
});

test("evaluateReward: eligible at required length", () => {
  const map = buildGreenRange("2026-04-01", 40); // enough greens after Sunday skips
  const streak = computeGreenStreak(map, "2026-05-10");
  const r = evaluateReward(streak, 30, false);
  assert.equal(r.eligible, true);
});

test("evaluateReward: not eligible below required length", () => {
  const map = buildGreenRange("2026-05-01", 29);
  const streak = computeGreenStreak(map, "2026-05-29");
  const r = evaluateReward(streak, 30, false);
  assert.equal(r.eligible, false);
});

test("evaluateReward: idempotent when overlapping reward exists", () => {
  const map = buildGreenRange("2026-04-01", 40);
  const streak = computeGreenStreak(map, "2026-05-10");
  const r = evaluateReward(streak, 30, true);
  assert.equal(r.eligible, false);
});
