import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const engine = await readFile(new URL("../lib/us-substantial-presence.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/page.tsx", import.meta.url), "utf8");
const hostStatePage = await readFile(new URL("../app/uat/mobility/aditi-india-us/host-state/page.tsx", import.meta.url), "utf8");
const caseSummary = await readFile(new URL("../lib/uat-mobility-case-summary.ts", import.meta.url), "utf8");
const readiness = await readFile(new URL("../lib/uat-mobility-readiness.ts", import.meta.url), "utf8");

test("US substantial presence engine encodes the verified weighted-day mechanism", () => {
  assert.match(engine, /current \* 6 \+ prior \* 2 \+ secondPrior/);
  assert.match(engine, /current >= 31/);
  assert.match(engine, /183 \* 6/);
  assert.match(engine, /REVIEW_REQUIRED/);
  assert.match(engine, /US-SPT-2026-09-IRS/);
});

test("India US mobility page keeps state tax and US monetary tax fail-closed", () => {
  assert.match(page, /U\.S\. host state/);
  assert.match(page, /U\.S\. federal\/state monetary tax engine is not yet verified/);
  assert.match(page, /India–U\.S\. social-security position requires specialist review/);
  assert.match(page, /assessSubstantialPresence/);
  assert.match(page, /Mobility Guardian/);
});

test("India US mobility case renders authoritative unified workstreams", () => {
  assert.match(page, /caseSummary\.workstreams\.map/);
  assert.match(page, /caseSummary\.blockers/);
  assert.match(page, /caseSummary\.openReviews/);
  assert.match(page, /Authoritative case blocker/);
  assert.match(caseSummary, /id: "host-state"/);
  assert.match(caseSummary, /\/uat\/mobility\/aditi-india-us\/day-ledger/);
  assert.match(caseSummary, /\/uat\/mobility\/aditi-india-us\/compensation/);
  assert.match(caseSummary, /\/uat\/mobility\/aditi-india-us\/hypothetical-tax/);
  assert.match(page, /Engine not verified/);
  assert.match(page, /Specialist review/);
});

test("editable mobility controls are clearly separated from authoritative case state", () => {
  assert.match(page, /Assignment facts scenario sandbox/);
  assert.match(page, /U\.S\. substantial presence scenario sandbox/);
  assert.match(page, /Non-authoritative/);
  assert.match(page, /do not update the authoritative mobility case/);
  assert.match(page, /do not replace the evidence-backed day ledger or authoritative case SPT status/);
  assert.match(page, /does not update the authoritative case/);
});

test("host-state evidence screen exposes authoritative blocker reason and next action", () => {
  assert.match(hostStatePage, /Why this gate is blocked/);
  assert.match(hostStatePage, /evidence\.blockingReason/);
  assert.match(hostStatePage, /Next safe action/);
  assert.match(hostStatePage, /evidence\.nextAction/);
  assert.match(hostStatePage, /Fail-closed rule/);
});

test("host-state UAT persistence readiness remains an observable fail-closed boundary", () => {
  assert.match(hostStatePage, /resolveHostStateEvidencePersistenceRuntimeState\(process\.env\)/);
  assert.match(hostStatePage, /inspectHostStateEvidencePersistenceReadiness\(runtime\)/);
  assert.match(hostStatePage, /persistenceReadiness\.ready \? "Runtime ready" : "Fail closed"/);
  assert.match(hostStatePage, /Writes activated/);
  assert.match(hostStatePage, /<dd className="mt-1 font-medium">No<\/dd>/);
  assert.match(hostStatePage, /does not activate verification writes or state tax calculation/);
});

test("unverified host-state evidence cannot authorize state tax or payroll activation", () => {
  assert.match(caseSummary, /status: "UNVERIFIED"/);
  assert.match(caseSummary, /authoritativeState: null/);
  assert.match(caseSummary, /stateTaxAssessmentAllowed: false/);
  assert.match(caseSummary, /status: hasCompleteVerificationProvenance \? "VERIFIED" : "MISSING"/);
  assert.match(caseSummary, /evidenceReference = input\.evidenceReference\?\.trim\(\) \|\| null/);
  assert.match(caseSummary, /verifiedBy = input\.verifiedBy\?\.trim\(\) \|\| null/);
  assert.match(caseSummary, /verifiedAt = input\.verifiedAt\?\.trim\(\) \|\| null/);
  assert.match(readiness, /resolveHostStateReadinessGateStatus\(allRequiredHostStateEvidenceVerified\)/);
  assert.match(readiness, /const payrollActivationAllowed = blockedCount === 0 && reviewCount === 0/);
  assert.match(readiness, /Keep actual US monetary tax and host-payroll activation blocked until verified engines are available/);
});

test("host-state evidence reaches VERIFIED only with complete provenance", () => {
  assert.match(caseSummary, /export function buildHostStateEvidenceItem/);
  assert.match(caseSummary, /Boolean\(evidenceReference && verifiedBy && verifiedAt\)/);
  assert.match(caseSummary, /status: hasCompleteVerificationProvenance \? "VERIFIED" : "MISSING"/);
  assert.match(caseSummary, /An evidence item may be marked VERIFIED only when its source reference, reviewer identity, and verification timestamp are recorded/);
});

test("all required host-state evidence must be verified before the gate may progress", () => {
  assert.match(caseSummary, /export function areAllHostStateEvidenceItemsVerified/);
  assert.match(caseSummary, /items\.length > 0/);
  assert.match(caseSummary, /items\.every/);
  assert.match(caseSummary, /item\.status === "VERIFIED"/);
  assert.match(caseSummary, /Boolean\(item\.evidenceReference && item\.verifiedBy && item\.verifiedAt\)/);
  assert.match(caseSummary, /allRequiredEvidenceVerified: allRequiredHostStateEvidenceVerified/);
  assert.match(caseSummary, /All required evidence items must be VERIFIED before the host-state evidence gate may progress/);
});

test("verified host-state evidence can only advance the readiness gate to controlled review", () => {
  assert.match(readiness, /export function resolveHostStateReadinessGateStatus/);
  assert.match(readiness, /allRequiredEvidenceVerified \? "REVIEW_REQUIRED" : "BLOCKED"/);
  assert.match(readiness, /allRequiredHostStateEvidenceVerified\?: boolean/);
  assert.match(readiness, /Authoritative state selection still requires controlled review/);
  assert.match(readiness, /status: "BLOCKED"/);
  assert.doesNotMatch(readiness, /allRequiredEvidenceVerified \? "READY"/);
});

test("unified mobility page surfaces authoritative host-state guidance", () => {
  assert.match(page, /Authoritative action required/);
  assert.match(page, /caseSummary\.hostStateEvidence\.blockingReason/);
  assert.match(page, /Next safe action:/);
  assert.match(page, /caseSummary\.hostStateEvidence\.nextAction/);
  assert.match(page, /caseSummary\.hostStateEvidence\.verifiedEvidenceItems/);
  assert.match(page, /caseSummary\.hostStateEvidence\.stateTaxAssessmentAllowed/);
  assert.match(page, /Review host-state evidence/);
});
