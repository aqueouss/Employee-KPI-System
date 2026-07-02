import assert from "node:assert/strict";
import test from "node:test";

import { resolveMonthlySalaryForMonth } from "@/lib/payroll/salary-for-month";

test("resolveMonthlySalaryForMonth: uses revision effective for that month", () => {
  const revisions = [
    { effective_month: "2025-06-01", monthly_salary: 30000 },
    { effective_month: "2025-07-01", monthly_salary: 35000 },
  ];

  assert.equal(
    resolveMonthlySalaryForMonth(revisions, "2025-06-01", 35000),
    30000,
  );
  assert.equal(
    resolveMonthlySalaryForMonth(revisions, "2025-07-01", 30000),
    35000,
  );
});

test("resolveMonthlySalaryForMonth: falls back to profile when no revisions", () => {
  assert.equal(resolveMonthlySalaryForMonth([], "2025-06-01", 30000), 30000);
});

test("resolveMonthlySalaryForMonth: uses earliest revision before first recorded month", () => {
  const revisions = [{ effective_month: "2025-06-01", monthly_salary: 30000 }];
  assert.equal(
    resolveMonthlySalaryForMonth(revisions, "2025-04-01", 35000),
    30000,
  );
});

test("resolveMonthlySalaryForMonth: keeps prior salary after increment revision", () => {
  const revisions = [
    { effective_month: "2025-04-01", monthly_salary: 30000 },
    { effective_month: "2025-07-01", monthly_salary: 35000 },
  ];

  assert.equal(
    resolveMonthlySalaryForMonth(revisions, "2025-06-01", 35000),
    30000,
  );
  assert.equal(
    resolveMonthlySalaryForMonth(revisions, "2025-07-01", 30000),
    35000,
  );
});
