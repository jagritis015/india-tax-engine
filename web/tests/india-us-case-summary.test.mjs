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

test("case summary aggregates existing mobility workstreams without enabling blocked payroll", async () => {
  const { buildAditiIndiaUsCaseSummary } = await vite.ssrLoadModule("/lib/uat-mobility-case-summary.ts");
  const summary = buildAditiIndiaUsCaseSummary();

  assert.equal(summary.caseId, "MOB-NVL-017-IND-US");
  assert.equal(summary.overallStatus, "BLOCKED");
  assert.equal(summary.payrollActivationAllowed, false);
  assert.equal(summary.monthlyAssignmentCompInr, 506000);
  assert.equal(summary.monthlyStayAtHomeGrossInr, 156000);
  assert.equal(summary.pendingDayEvidence, 1);
  assert.equal(summary.unresolvedCompensationItems, 2);
  assert.equal(summary.openReviews, 4);
  assert.equal(summary.blockers, 2);
  assert.equal(summary.workstreams.length, 7);
  assert.equal(summary.workstreams.find((item) => item.id === "host-state")?.status, "BLOCKED");
  assert.equal(summary.workstreams.find((item) => item.id === "us-tax")?.status, "BLOCKED");
});

test("case summary API stays deterministic, no-store and fail-closed", async () => {
  const route = await readFile(new URL("../app/api/mobility/aditi-india-us/summary/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/page.tsx", import.meta.url), "utf8");

  assert.match(route, /buildAditiIndiaUsCaseSummary/);
  assert.match(route, /Cache-Control/);
  assert.match(route, /deterministic-fail-closed-uat/);
  assert.match(page, /\/api\/mobility\/aditi-india-us\/summary/);
  assert.match(page, /cache: "no-store"/);
  assert.match(page, /Unified case control/);
  assert.match(page, /caseSummary\.payrollActivationAllowed/);
  assert.match(page, /caseSummary\.workstreams\.map/);
  assert.match(page, /Payroll activation remains blocked/);
});
