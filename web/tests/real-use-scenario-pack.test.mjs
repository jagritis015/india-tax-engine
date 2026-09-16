import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test, { after } from "node:test";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

test("all seven real-use UAT scenarios reconcile to versioned expected outputs", async () => {
  const { SCENARIO_CATALOG, runScenario } = await vite.ssrLoadModule("/lib/uat-scenario-pack.ts");
  assert.equal(SCENARIO_CATALOG.length, 7);
  for (const scenario of SCENARIO_CATALOG) {
    const run = runScenario(scenario.id);
    assert.equal(run.allChecksPassed, true, `${scenario.id} should reconcile`);
    assert.ok(run.checks.every((check) => check.passed), `${scenario.id} should have no failed checks`);
  }
});

test("100 employee baseline produces review rows and deterministic company totals", async () => {
  const { runPayrollScenario } = await vite.ssrLoadModule("/lib/uat-scenario-pack.ts");
  const run = runPayrollScenario("monthly-baseline-100");

  assert.equal(run.actual.employeeCount, 100);
  assert.equal(run.actual.calculatedCount, 97);
  assert.equal(run.actual.reviewCount, 3);
  assert.equal(run.actual.grossPayroll, 13_151_000);
  assert.equal(run.actual.totalTds, 1_662_339);
  assert.equal(run.actual.totalEmployeePf, 174_600);
  assert.equal(run.actual.totalProfessionalTax, 19_400);
  assert.equal(run.actual.totalDeductions, 1_856_339);
  assert.equal(run.actual.netPayable, 11_294_661);
  assert.equal(run.rows.filter((row) => row.status === "REVIEW_REQUIRED").length, 3);
});

test("statutory boundary scenario proves PT and PF threshold behavior", async () => {
  const { runPayrollScenario } = await vite.ssrLoadModule("/lib/uat-scenario-pack.ts");
  const run = runPayrollScenario("statutory-boundaries-7");
  const belowPt = run.rows.find((row) => row.employeeId === "UAT-B01");
  const atPt = run.rows.find((row) => row.employeeId === "UAT-B02");
  const belowPf = run.rows.find((row) => row.employeeId === "UAT-B03");
  const atPf = run.rows.find((row) => row.employeeId === "UAT-B04");
  const abovePf = run.rows.find((row) => row.employeeId === "UAT-B05");

  assert.equal(belowPt?.grossSalary, 24_999);
  assert.equal(belowPt?.professionalTax, 0);
  assert.equal(atPt?.grossSalary, 25_000);
  assert.equal(atPt?.professionalTax, 200);
  assert.equal(belowPf?.employeePf, 1_800);
  assert.equal(atPf?.employeePf, 1_800);
  assert.equal(abovePf?.employeePf, 1_800);
});

test("fail-closed pack blocks invalid values and reviews unsupported or unresolved records", async () => {
  const { runPayrollScenario } = await vite.ssrLoadModule("/lib/uat-scenario-pack.ts");
  const run = runPayrollScenario("fail-closed-controls-4");

  assert.equal(run.actual.calculatedCount, 0);
  assert.equal(run.actual.reviewCount, 3);
  assert.equal(run.actual.blockedCount, 1);
  assert.match(run.rows.find((row) => row.employeeId === "UAT-F01")?.reviewReason ?? "", /surcharge/);
  assert.match(run.rows.find((row) => row.employeeId === "UAT-F02")?.reviewReason ?? "", /non-negative/);
});

test("immigration case pack covers complete, action-required and blocked evidence", async () => {
  const { runImmigrationScenarioPack } = await vite.ssrLoadModule("/lib/uat-scenario-pack.ts");
  const run = runImmigrationScenarioPack();

  assert.deepEqual(run.actual, { caseCount: 8, completeCount: 1, actionRequiredCount: 4, blockedCount: 3 });
  assert.equal(run.rows.filter((row) => row.matchedExpected).length, 8);
  assert.equal(run.rows.every((row) => row.input.caseId.startsWith("MOB-UAT-")), true);
});

test("download datasets contain complete employee, payroll, immigration and test data", async () => {
  const { getScenarioDataset } = await vite.ssrLoadModule("/lib/uat-scenario-pack.ts");
  assert.equal(getScenarioDataset("employee-master").length, 100);
  assert.equal(getScenarioDataset("baseline-inputs").length, 100);
  assert.equal(getScenarioDataset("baseline-expected").length, 100);
  assert.equal(getScenarioDataset("payroll-scenario-inputs").length, 121);
  assert.equal(getScenarioDataset("payroll-scenario-expected").length, 121);
  assert.equal(getScenarioDataset("immigration-inputs").length, 8);
  assert.equal(getScenarioDataset("immigration-expected").length, 8);
  assert.equal(getScenarioDataset("test-script").length, 7);
});

test("Scenario Lab is connected to live routes and downloadable data sheets", async () => {
  const page = await readFile(new URL("../app/uat/scenarios/page.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/uat/scenarios/route.ts", import.meta.url), "utf8");
  const download = await readFile(new URL("../app/api/uat/scenarios/download/route.ts", import.meta.url), "utf8");
  const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /Real-use Scenario Lab/);
  assert.match(page, /Run .*selected\.label/);
  assert.match(page, /allChecksPassed/);
  assert.match(page, /india-payroll-os-real-use-uat-pack\.xlsx/);
  assert.match(route, /runScenario/);
  assert.match(route, /deterministic-reconciliation/);
  assert.match(download, /Content-Disposition/);
  assert.match(download, /text\/csv/);
  assert.match(home, /Scenario Lab/);
  assert.match(home, /view==="scenarios"/);
});
