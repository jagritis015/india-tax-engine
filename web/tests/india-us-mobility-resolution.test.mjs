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

test("human mobility gates require complete evidence answers", async () => {
  const { assessMobilityResolution, EMPTY_MOBILITY_RESOLUTION } = await vite.ssrLoadModule("/lib/uat-mobility-resolution.ts");
  const assessment = assessMobilityResolution(EMPTY_MOBILITY_RESOLUTION, new Date("2026-09-16T12:00:00.000Z"));

  assert.equal(assessment.readyCount, 0);
  assert.equal(assessment.totalCount, 5);
  assert.equal(assessment.allHumanGatesReady, false);
  assert.equal(assessment.gates["host-state"].ready, false);
  assert.equal(assessment.systemBlocker, "US_MONETARY_TAX_ENGINE_UNVERIFIED");
});

test("representative UAT answers pass every human gate but not the system tax gate", async () => {
  const { assessMobilityResolution, REPRESENTATIVE_MOBILITY_RESOLUTION } = await vite.ssrLoadModule("/lib/uat-mobility-resolution.ts");
  const assessment = assessMobilityResolution(REPRESENTATIVE_MOBILITY_RESOLUTION, new Date("2026-09-16T12:00:00.000Z"));

  assert.equal(assessment.readyCount, 5);
  assert.equal(assessment.allHumanGatesReady, true);
  assert.ok(Object.values(assessment.gates).every((gate) => gate.ready));
  assert.equal(assessment.systemBlocker, "US_MONETARY_TAX_ENGINE_UNVERIFIED");
});

test("future-dated reviews fail deterministic validation", async () => {
  const { assessMobilityResolution, REPRESENTATIVE_MOBILITY_RESOLUTION } = await vite.ssrLoadModule("/lib/uat-mobility-resolution.ts");
  const draft = structuredClone(REPRESENTATIVE_MOBILITY_RESOLUTION);
  draft.immigration.reviewedAt = "2026-09-17T09:00";
  const assessment = assessMobilityResolution(draft, new Date("2026-09-16T12:00:00.000Z"));

  assert.equal(assessment.gates.immigration.ready, false);
  assert.match(assessment.gates.immigration.errors.join(" "), /cannot be in the future/);
});

test("readiness and workstream pages route reviewers to answer controls", async () => {
  const readinessPage = await readFile(new URL("../app/uat/mobility/aditi-india-us/readiness/page.tsx", import.meta.url), "utf8");
  const workbench = await readFile(new URL("../components/mobility-resolution-workbench.tsx", import.meta.url), "utf8");
  const dayLedgerPage = await readFile(new URL("../app/uat/mobility/aditi-india-us/day-ledger/page.tsx", import.meta.url), "utf8");
  const compensationPage = await readFile(new URL("../app/uat/mobility/aditi-india-us/compensation/page.tsx", import.meta.url), "utf8");

  assert.match(readinessPage, /MobilityResolutionWorkbench/);
  assert.match(readinessPage, /Answer/);
  assert.match(readinessPage, /Complete/);
  assert.doesNotMatch(readinessPage, /#resolution-india-hypothetical-tax/);
  assert.match(workbench, /Fill sample answers/);
  assert.match(workbench, /Test form complete/);
  assert.match(workbench, /There is intentionally no manual pass control/);
  assert.match(dayLedgerPage, /Answer pending evidence/);
  assert.match(compensationPage, /Answer treatment reviews/);
});
