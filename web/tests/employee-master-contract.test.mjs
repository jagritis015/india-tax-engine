import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/uat/employee-master/page.tsx", import.meta.url), "utf8");

test("employee payroll master edits source inputs and invokes deterministic calculation API", () => {
  assert.match(page, /Employee payroll master/);
  assert.match(page, /basicSalary/);
  assert.match(page, /taxableSalaryYtd/);
  assert.match(page, /tdsDeductedYtd/);
  assert.match(page, /pfWages/);
  assert.match(page, /fetch\("\/api\/payroll\/calculate"/);
  assert.match(page, /Recalculate payroll/);
});

test("employee payroll master is explicit about temporary UAT persistence", () => {
  assert.match(page, /localStorage/);
  assert.match(page, /temporary UAT adapter/);
  assert.match(page, /synthetic data only/i);
  assert.match(page, /do not yet represent multi-user production persistence/i);
});
