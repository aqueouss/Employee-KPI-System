#!/usr/bin/env node
/**
 * Post-deploy smoke test.
 *
 * Verifies the deployed app is healthy and the daily KPI cron endpoint is
 * reachable and correctly authorized. Safe to run against production: the
 * pipeline is idempotent and defaults to (re)processing yesterday.
 *
 * Usage:
 *   BASE_URL=https://your-app.vercel.app CRON_SECRET=xxx node scripts/smoke-test.mjs
 *
 * Optional:
 *   RUN_PIPELINE=1   also POST to the cron endpoint and assert it succeeds
 */

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const CRON_SECRET = process.env.CRON_SECRET;
const RUN_PIPELINE = process.env.RUN_PIPELINE === "1";

let failures = 0;

function pass(name) {
  console.log(`  \u2713 ${name}`);
}

function fail(name, detail) {
  failures += 1;
  console.error(`  \u2717 ${name}\n      ${detail}`);
}

async function checkHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  const body = await res.json().catch(() => ({}));
  if (res.ok && body?.ok !== false) {
    pass(`health endpoint OK (${res.status})`);
  } else {
    fail("health endpoint", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

async function checkCronAuth() {
  const res = await fetch(`${BASE_URL}/api/cron/daily-kpi`, {
    headers: { authorization: "Bearer definitely-not-the-secret" },
  });
  if (res.status === 401) {
    pass("cron rejects bad secret (401)");
  } else {
    fail("cron auth", `expected 401, got ${res.status}`);
  }
}

async function runPipeline() {
  if (!RUN_PIPELINE) {
    console.log("  \u2026 skipping pipeline run (set RUN_PIPELINE=1 to enable)");
    return;
  }
  if (!CRON_SECRET) {
    fail("pipeline run", "RUN_PIPELINE=1 but CRON_SECRET is not set");
    return;
  }
  const res = await fetch(`${BASE_URL}/api/cron/daily-kpi`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${CRON_SECRET}`,
      "content-type": "application/json",
    },
    body: "{}",
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok && body?.ok) {
    pass(
      `pipeline ran (processed=${body.processed}, warnings=${body.warningsIssued}, rewards=${body.rewardsCreated})`,
    );
  } else {
    fail("pipeline run", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

async function main() {
  console.log(`Smoke testing ${BASE_URL}\n`);
  await checkHealth();
  await checkCronAuth();
  await runPipeline();

  console.log("");
  if (failures > 0) {
    console.error(`FAILED: ${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("All smoke checks passed.");
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
