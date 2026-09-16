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

test("assignment readiness aggregates existing evidence and fails closed", async () => {
  const { assessAditiIndiaUsReadiness } = await vite.ssrLoadModule("/lib/uat-mobility-readiness.ts");
  const snapshot = assessAditiIndiaUsReadiness();

  assert.equal(snapshot.status, "BLOCKED");
  assert.equal(snapshot.payrollActivationAllowed, false);
  assert.equal(snapshot.gates.length, 7);
  assert.equal(snapshot.readyCount, 1);
  assert.equal(snapshot.reviewCount, 4);
  assert.equal(snapshot.blockedCount, 2);
  assert.equal(snapshot.evidenceSummary.pendingDayEvidence, 1);
  assert.equal(snapshot.evidenceSummary.unresolvedCompensationItems, 2);
  assert.equal(snapshot.evidenceSummary.indiaHypotheticalTaxStatus, "CALCULATED");
  assert.equal(snapshot.gates.find((gate) => gate.id === "us-tax-engine")?.status, "BLOCKED");
});

test("readiness API and pages expose the controlled mobility workflow", async () => {
  const route = await readFile(new URL("../app/api/mobility/aditi-india-us/readiness/route.ts", import.meta.url), "utf8");
  const readinessPage = await readFile(new URL("../app/uat/mobility/aditi-india-us/readiness/page.tsx", import.meta.url), "utf8");
  const casePage = await readFile(new URL("../app/uat/mobility/aditi-india-us/page.tsx", import.meta.url), "utf8");
  const homePage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(route, /assessAditiIndiaUsReadiness/);
  assert.match(route, /Cache-Control/);
  assert.match(route, /deterministic-fail-closed-uat/);
  assert.match(readinessPage, /Why payroll is still off/);
  assert.match(readinessPage, /Can Aditi&apos;s payroll be activated/);
  assert.match(readinessPage, /Saving test answers above does not change them/);
  assert.match(readinessPage, /Live case checks/);
  assert.match(casePage, /\/uat\/mobility\/aditi-india-us\/readiness/);
  assert.match(homePage, /Global mobility/);
  assert.match(homePage, /Open mobility case/);
  assert.match(homePage, /New in UAT/);
  assert.match(homePage, /Aditi Joshi · Assignment readiness/);
  assert.match(homePage, /Open readiness control/);
});
