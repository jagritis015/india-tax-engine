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

test("incomplete immigration facts create an action queue and never activate payroll", async () => {
  const { assessImmigrationSupport, EMPTY_IMMIGRATION_SUPPORT_INPUT } = await vite.ssrLoadModule("/lib/uat-immigration-support.ts");
  const assessment = assessImmigrationSupport(EMPTY_IMMIGRATION_SUPPORT_INPUT, new Date("2026-09-16T12:00:00.000Z"));

  assert.equal(assessment.status, "ACTION_REQUIRED");
  assert.equal(assessment.payrollActivationAllowed, false);
  assert.equal(assessment.specialistDecisionRequired, true);
  assert.equal(assessment.legalConclusion, "NOT_PROVIDED");
  assert.ok(assessment.actions.length >= 4);
  assert.match(assessment.automationSummary.nextAction, /Complete|Collect/);
});

test("representative case completes automated preflight without becoming a legal approval", async () => {
  const { assessImmigrationSupport, REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT } = await vite.ssrLoadModule("/lib/uat-immigration-support.ts");
  const assessment = assessImmigrationSupport(REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT, new Date("2026-09-16T12:00:00.000Z"));

  assert.equal(assessment.status, "PRECHECK_COMPLETE");
  assert.equal(assessment.automationSummary.passedGateCount, assessment.automationSummary.totalGateCount);
  assert.ok(assessment.gates.every((gate) => gate.status === "PASS"));
  assert.equal(assessment.payrollActivationAllowed, false);
  assert.equal(assessment.actions.at(-1)?.id, "specialist-determination");
});

test("expired or late work authorization fails closed", async () => {
  const { assessImmigrationSupport, REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT } = await vite.ssrLoadModule("/lib/uat-immigration-support.ts");
  const expired = structuredClone(REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT);
  expired.workAuthorizationEndDate = "2026-09-15";
  const expiredAssessment = assessImmigrationSupport(expired, new Date("2026-09-16T12:00:00.000Z"));
  assert.equal(expiredAssessment.status, "BLOCKED");
  assert.equal(expiredAssessment.gates.find((gate) => gate.id === "work-authorization")?.status, "BLOCKED");
  assert.ok(expiredAssessment.alerts.some((alert) => alert.id === "expired-work-authorization" && alert.severity === "CRITICAL"));

  const late = structuredClone(REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT);
  late.workAuthorizationStartDate = "2026-10-02";
  const lateAssessment = assessImmigrationSupport(late, new Date("2026-09-16T12:00:00.000Z"));
  assert.equal(lateAssessment.status, "BLOCKED");
  assert.ok(lateAssessment.alerts.some((alert) => alert.id === "authorization-start-gap"));
});

test("coverage gaps become review actions instead of invented legal conclusions", async () => {
  const { assessImmigrationSupport, REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT } = await vite.ssrLoadModule("/lib/uat-immigration-support.ts");
  const input = structuredClone(REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT);
  input.workAuthorizationEndDate = "2028-01-31";
  input.passportExpiryDate = "2028-06-30";
  const assessment = assessImmigrationSupport(input, new Date("2026-09-16T12:00:00.000Z"));

  assert.equal(assessment.status, "ACTION_REQUIRED");
  assert.ok(assessment.actions.some((action) => action.id === "plan-authorization-extension"));
  assert.ok(assessment.actions.some((action) => action.id === "plan-passport-renewal"));
  assert.equal(assessment.legalConclusion, "NOT_PROVIDED");
});

test("Immigration Copilot answers supported case questions and refuses legal approval", async () => {
  const { assessImmigrationSupport, answerImmigrationQuestion, REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT } = await vite.ssrLoadModule("/lib/uat-immigration-support.ts");
  const assessment = assessImmigrationSupport(REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT, new Date("2026-09-16T12:00:00.000Z"));
  const activation = answerImmigrationQuestion("Can payroll activate?", assessment);
  const unsupported = answerImmigrationQuestion("Predict whether the government will approve this case", assessment);

  assert.equal(activation.intent, "ACTIVATION");
  assert.match(activation.answer, /No automatic approval/);
  assert.match(activation.answer, /Payroll activation remains blocked/);
  assert.equal(activation.requiresSpecialistReview, true);
  assert.equal(unsupported.intent, "UNSUPPORTED");
  assert.match(unsupported.answer, /cannot interpret immigration law/);
});

test("immigration UI and API expose the private UAT automation contract", async () => {
  const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/immigration/page.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/mobility/aditi-india-us/immigration/route.ts", import.meta.url), "utf8");
  const summary = await readFile(new URL("../lib/uat-mobility-case-summary.ts", import.meta.url), "utf8");

  assert.match(page, /Run immigration preflight/);
  assert.match(page, /Immigration Copilot/);
  assert.match(page, /Save in this browser/);
  assert.match(page, /no paid model/);
  assert.match(page, /Payroll activation is always blocked/);
  assert.match(route, /deterministic-rules-no-paid-ai/);
  assert.match(route, /X-Immigration-Support-Mode/);
  assert.match(route, /Cache-Control/);
  assert.match(summary, /aditi-india-us\/immigration/);
});
