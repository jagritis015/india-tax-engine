import assert from "node:assert/strict";
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

test("mobility case rollups stay consistent with workstream state", async () => {
  const { buildAditiIndiaUsCaseSummary } = await vite.ssrLoadModule("/lib/uat-mobility-case-summary.ts");
  const summary = buildAditiIndiaUsCaseSummary();

  const blockers = summary.workstreams.filter((item) => item.status === "BLOCKED").length;
  const reviews = summary.workstreams.filter((item) => item.status === "REVIEW_REQUIRED").length;

  assert.equal(summary.blockers, blockers);
  assert.equal(summary.openReviews, reviews);
  assert.equal(summary.payrollActivationAllowed, blockers === 0 && reviews === 0);
  assert.equal(summary.overallStatus, blockers > 0 ? "BLOCKED" : reviews > 0 ? "REVIEW_REQUIRED" : "READY");
});

test("blocked and review-required workstreams never silently become ready", async () => {
  const { buildAditiIndiaUsCaseSummary } = await vite.ssrLoadModule("/lib/uat-mobility-case-summary.ts");
  const summary = buildAditiIndiaUsCaseSummary();

  const usTax = summary.workstreams.find((item) => item.id === "us-tax");
  const immigration = summary.workstreams.find((item) => item.id === "immigration");
  const socialSecurity = summary.workstreams.find((item) => item.id === "social-security");

  assert.equal(usTax?.status, "BLOCKED");
  assert.equal(immigration?.status, "REVIEW_REQUIRED");
  assert.equal(socialSecurity?.status, "REVIEW_REQUIRED");
  assert.equal(summary.payrollActivationAllowed, false);
});
