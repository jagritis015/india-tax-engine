import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const bulkLib = await readFile(new URL("../lib/uat-bulk-payroll.ts", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/payroll/run/route.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/uat/payroll-run/page.tsx", import.meta.url), "utf8");

test("bulk payroll run stays server deterministic and fail-closed for source exceptions", () => {
  assert.match(bulkLib, /calculateSupportedUatPayroll/);
  assert.match(bulkLib, /REVIEW_REQUIRED/);
  assert.match(bulkLib, /employee\.status === "Ready"/);
  assert.match(bulkLib, /founder-uat-karnataka-profile/);
});

test("bulk payroll API is no-store and exposes the controlled UAT calculation mode", () => {
  assert.match(route, /runNivaBulkPayrollUat/);
  assert.match(route, /Cache-Control/);
  assert.match(route, /no-store/);
  assert.match(route, /founder-uat-karnataka-profile/);
});

test("bulk payroll page runs server calculation and exports the calculated register", () => {
  assert.match(page, /fetch\("\/api\/payroll\/run"/);
  assert.match(page, /Run payroll/);
  assert.match(page, /Download payroll register/);
  assert.match(page, /Review required/);
  assert.doesNotMatch(page, /calculateSupportedUatPayroll/);
});
