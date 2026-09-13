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

test("case summary exposes evidence-backed SPT provenance from the authoritative day ledger", async () => {
  const { buildAditiIndiaUsCaseSummary } = await vite.ssrLoadModule("/lib/uat-mobility-case-summary.ts");
  const summary = buildAditiIndiaUsCaseSummary();

  assert.equal(summary.dayEvidenceProvenance.source, "auditable-day-ledger");
  assert.equal(summary.dayEvidenceProvenance.ledgerHref, "/uat/mobility/aditi-india-us/day-ledger#evidence-d3");
  assert.equal(summary.workstreams.find((item) => item.id === "location")?.href, summary.dayEvidenceProvenance.ledgerHref);
  assert.equal(summary.dayEvidenceProvenance.totalEntries, 5);
  assert.equal(summary.dayEvidenceProvenance.verifiedEntries, 4);
  assert.equal(summary.dayEvidenceProvenance.pendingEntries, summary.pendingDayEvidence);
  assert.equal(summary.dayEvidenceProvenance.currentYearPhysicalDays, 3);
  assert.equal(summary.dayEvidenceProvenance.priorYearPhysicalDays, 1);
  assert.equal(summary.dayEvidenceProvenance.secondPriorYearPhysicalDays, 1);
  assert.equal(summary.dayEvidenceProvenance.substantialPresenceRuleVersion, "US-SPT-2026-09-IRS");
  assert.equal(summary.substantialPresenceStatus, "DOES_NOT_MEET_SPT");
});

test("case summary API stays deterministic, no-store and fail-closed", async () => {
  const route = await readFile(new URL("../app/api/mobility/aditi-india-us/summary/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/page.tsx", import.meta.url), "utf8");
  const ledgerPage = await readFile(new URL("../app/uat/mobility/aditi-india-us/day-ledger/page.tsx", import.meta.url), "utf8");

  assert.match(route, /buildAditiIndiaUsCaseSummary/);
  assert.match(route, /Cache-Control/);
  assert.match(route, /deterministic-fail-closed-uat/);
  assert.match(page, /\/api\/mobility\/aditi-india-us\/summary/);
  assert.match(page, /cache: "no-store"/);
  assert.match(page, /Unified case control/);
  assert.match(page, /caseSummary\.payrollActivationAllowed/);
  assert.match(page, /caseSummary\.workstreams\.map/);
  assert.match(page, /Payroll activation remains blocked/);
  assert.match(page, /Authoritative SPT evidence/);
  assert.match(page, /caseSummary\.dayEvidenceProvenance\.ledgerHref/);
  assert.match(page, /caseSummary\.dayEvidenceProvenance\.verifiedEntries/);
  assert.match(page, /caseSummary\.dayEvidenceProvenance\.pendingEntries/);
  assert.match(page, /caseSummary\.dayEvidenceProvenance\.substantialPresenceRuleVersion/);
  assert.match(page, /Scenario inputs below cannot change it/);
  assert.match(ledgerPage, /id={`evidence-\${item\.id}`}/);
  assert.match(ledgerPage, /item\.evidenceStatus==="pending"/);
  assert.match(ledgerPage, /jump directly to the first unresolved evidence record/);
});