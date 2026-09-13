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

test("host-state blocker exposes an authoritative evidence checklist without inferring tax scope", async () => {
  const { buildAditiIndiaUsCaseSummary } = await vite.ssrLoadModule("/lib/uat-mobility-case-summary.ts");
  const summary = buildAditiIndiaUsCaseSummary();
  const hostState = summary.workstreams.find((item) => item.id === "host-state");

  assert.equal(summary.hostStateEvidence.status, "UNVERIFIED");
  assert.equal(summary.hostStateEvidence.source, "assignment-profile");
  assert.equal(summary.hostStateEvidence.authoritativeState, null);
  assert.equal(summary.hostStateEvidence.stateTaxAssessmentAllowed, false);
  assert.equal(summary.hostStateEvidence.requiredEvidence.length, 3);
  assert.equal(summary.hostStateEvidence.totalEvidenceItems, 3);
  assert.equal(summary.hostStateEvidence.verifiedEvidenceItems, 0);
  assert.deepEqual(summary.hostStateEvidence.evidenceItems.map((item) => item.status), ["MISSING", "MISSING", "MISSING"]);
  assert.match(summary.hostStateEvidence.verificationPolicy, /source reference, reviewer identity, and verification timestamp/);
  assert.deepEqual(summary.hostStateEvidence.evidenceItems.map((item) => item.evidenceReference), [null, null, null]);
  assert.deepEqual(summary.hostStateEvidence.evidenceItems.map((item) => item.verifiedBy), [null, null, null]);
  assert.deepEqual(summary.hostStateEvidence.evidenceItems.map((item) => item.verifiedAt), [null, null, null]);
  assert.match(summary.hostStateEvidence.blockingReason, /state and local tax scope cannot be assessed/);
  assert.match(summary.hostStateEvidence.nextAction, /Verify all required host-state evidence/);
  assert.equal(hostState?.status, "BLOCKED");
  assert.equal(hostState?.href, summary.hostStateEvidence.evidenceHref);
});

test("host-state evidence verification validator accepts only auditable reviewer-bound evidence", async () => {
  const { validateHostStateEvidenceVerification } = await vite.ssrLoadModule("/lib/uat-host-state-evidence-verification.ts");
  const now = new Date("2026-09-13T16:30:00.000Z");
  const result = validateHostStateEvidenceVerification(
    {
      evidenceItemId: "assignment-letter",
      evidenceReference: "assignment-letter://NVL-017/v1",
      reviewerId: "reviewer-42",
      verifiedAt: "2026-09-13T16:00:00.000Z",
    },
    "reviewer-42",
    now,
  );

  assert.equal(result.accepted, true);
  assert.deepEqual(result.errors, []);
});

test("host-state evidence verification validator fails closed for missing audit data or reviewer mismatch", async () => {
  const { validateHostStateEvidenceVerification } = await vite.ssrLoadModule("/lib/uat-host-state-evidence-verification.ts");
  const now = new Date("2026-09-13T16:30:00.000Z");
  const result = validateHostStateEvidenceVerification(
    {
      evidenceItemId: "scenario-host-state",
      evidenceReference: " ",
      reviewerId: "spoofed-reviewer",
      verifiedAt: "2026-09-13T17:00:00.000Z",
    },
    "reviewer-42",
    now,
  );

  assert.equal(result.accepted, false);
  assert.match(result.errors.join(" "), /not part of the authoritative host-state checklist/);
  assert.match(result.errors.join(" "), /Evidence source reference is required/);
  assert.match(result.errors.join(" "), /Reviewer identity must match the authenticated reviewer/);
  assert.match(result.errors.join(" "), /cannot be in the future/);
});

test("case summary API stays deterministic, no-store and fail-closed", async () => {
  const route = await readFile(new URL("../app/api/mobility/aditi-india-us/summary/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/page.tsx", import.meta.url), "utf8");
  const ledgerPage = await readFile(new URL("../app/uat/mobility/aditi-india-us/day-ledger/page.tsx", import.meta.url), "utf8");
  const hostStatePage = await readFile(new URL("../app/uat/mobility/aditi-india-us/host-state/page.tsx", import.meta.url), "utf8");

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
  assert.match(hostStatePage, /US host-state evidence/);
  assert.match(hostStatePage, /Scenario host-state inputs elsewhere do not update this record/);
  assert.match(hostStatePage, /Evidence checklist/);
  assert.match(hostStatePage, /evidence\.verificationPolicy/);
  assert.match(hostStatePage, /item\.evidenceReference/);
  assert.match(hostStatePage, /item\.verifiedBy/);
  assert.match(hostStatePage, /item\.verifiedAt/);
  assert.match(hostStatePage, /evidence\.verifiedEvidenceItems/);
  assert.match(hostStatePage, /evidence\.totalEvidenceItems/);
  assert.match(hostStatePage, /evidence\.evidenceItems\.map/);
  assert.match(hostStatePage, /state and local tax scope must not be inferred/);
});
