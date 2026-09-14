import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});
test.after(async () => vite.close());

function createRepository() {
  const history = [];
  const appends = [];

  return {
    appends,
    async read() {
      return [...history];
    },
    async append(caseId, record) {
      appends.push({ caseId, record });
      history.push(record);
    },
  };
}

test("server-derived reviewer context becomes the persisted reviewer identity", async () => {
  const { persistHostStateEvidenceVerificationFromReviewerContext } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification.ts",
  );
  const repository = createRepository();

  const result = await persistHostStateEvidenceVerificationFromReviewerContext(
    "NVL-017",
    {
      evidenceItemId: "assignment-letter",
      evidenceReference: "assignment-letter://NVL-017/v2",
      verifiedAt: "2026-09-14T00:30:00.000Z",
      reviewerId: "spoofed-client-reviewer",
    },
    { reviewerId: "server-reviewer-42" },
    repository,
    new Date("2026-09-14T01:00:00.000Z"),
  );

  assert.equal(result.accepted, true);
  assert.equal(repository.appends.length, 1);
  assert.equal(result.record.reviewerId, "server-reviewer-42");
  assert.equal(repository.appends[0].record.reviewerId, "server-reviewer-42");
});

test("missing server-derived reviewer context fails closed and never appends", async () => {
  const { persistHostStateEvidenceVerificationFromReviewerContext } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification.ts",
  );
  const repository = createRepository();

  const result = await persistHostStateEvidenceVerificationFromReviewerContext(
    "NVL-017",
    {
      evidenceItemId: "primary-worksite",
      evidenceReference: "worksite://NVL-017/v2",
      verifiedAt: "2026-09-14T00:30:00.000Z",
    },
    { reviewerId: null },
    repository,
    new Date("2026-09-14T01:00:00.000Z"),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.record, null);
  assert.equal(repository.appends.length, 0);
  assert.match(result.errors.join(" "), /authenticated reviewer identity is required/i);
});
