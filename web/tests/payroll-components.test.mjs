import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test, { after } from "node:test";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("India catalogue provides governed component mappings and a global technology template", async () => {
  const { INDIA_PAYROLL_COMPONENTS, NIVA_GLOBAL_TECH_TEMPLATE } = await vite.ssrLoadModule("/lib/india-payroll-components.ts");
  assert.equal(INDIA_PAYROLL_COMPONENTS.length, 32);
  assert.equal(NIVA_GLOBAL_TECH_TEMPLATE.componentCodes.length, 21);
  assert.ok(INDIA_PAYROLL_COMPONENTS.every((item) => item.code && item.payslipName && item.category && item.calculation));
  assert.equal(INDIA_PAYROLL_COMPONENTS.find((item) => item.code === "SPL_ALLOW").pfTreatment, "Statutory evaluation");
  assert.equal(INDIA_PAYROLL_COMPONENTS.find((item) => item.code === "RSU_PERQ").cash, false);
});

test("component-coded earnings calculate deterministic statutory outputs", async () => {
  const { calculateFromComponents } = await vite.ssrLoadModule("/lib/india-payroll-components.ts");
  const calculation = calculateFromComponents({ employeeId: "NVL-UAT-001", employeeName: "Aarav Mehta", values: { BASIC: 100000, HRA: 40000, SPL_ALLOW: 60000, PERF_BONUS: 0, SALES_COMM: 0 }, taxableSalaryYtd: 1000000, tdsDeductedYtd: 0, pfWages: 15000 });
  assert.equal(calculation.result.status, "CALCULATED");
  assert.equal(calculation.result.grossSalary, 200000);
  assert.equal(calculation.result.employeePf, 1800);
  assert.equal(calculation.result.professionalTax, 200);
  assert.equal(calculation.result.totalDeductions, calculation.result.tds + 2000);
  assert.deepEqual(calculation.calculatedComponents.map((item) => item.code), ["TDS", "EE_PF", "PT"]);
});

test("component catalogue page and API expose working UAT controls", async () => {
  const [page, route, home] = await Promise.all([
    readFile(new URL("../app/uat/payroll-components/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/payroll/components/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Search and inspect mappings/);
  assert.match(page, /Download catalogue CSV/);
  assert.match(page, /Run component calculation/);
  assert.match(route, /calculateFromComponents/);
  assert.match(route, /Cache-Control/);
  assert.match(home, /Pay setup/);
  assert.match(home, /\/uat\/payroll-components/);
});
