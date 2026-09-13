import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true } });
test.after(async () => vite.close());

function createRepository(seed = []) {
  const history = new Map([["NVL-017", [...seed]]]);
  const appends = [];

  return {
    appends,
    async read(caseId) {
      return [...(history.get(caseId) ?? [])];
    },
    async append(caseId, record) {
      appends.push({ caseId, record });
      history.set(caseId, [...(history.get(caseId) ?? []), record]);
    },
  };
}

test("accepted host-state verification persists only the normalized audit record", async () => {
  const { persistHostStateEvidenceVerification } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification.ts",
  );
  const repository = createRepository([
    {
      sequence: 1,
      evidenceItemId: "primary-worksite",
      evidenceReference: "worksite://NVL-017/v1",
      reviewerId: "reviewer-17",
      verifiedAt: "2026-09-13T15:00:00.000Z",
      recordedAt: "2026-09-13T15:05:00.000Z",
    },
  ]);

  const result = await persistHostStateEvidenceVerification(
    "NVL-017",
    {
      evidenceItemId: "assignment-letter",
      evidenceReference: "  assignment-letter://NVL-017/v1  ",
      reviewerId: "reviewer-42",
      verifiedAt: "2026-09-13T16:00:00.000Z",
    },
    "reviewer-42",
    repository,
    new Date("2026-09-13T16:30:00.000Z"),
  );

  assert.equal(result.accepted, true);
  assert.equal(repository.appends.length, 1);
  assert.equal(repository.appends[0].caseId, "NVL-017");
  assert.deepEqual(repository.appends[0].record, result.record);
  assert.equal(result.record.sequence, 2);
  assert.equal(result.record.evidenceReference, "assignment-letter://NVL-017/v1");
  assert.equal(result.record.reviewerId, "reviewer-42");
});

test("rejected host-state verification never reaches the persistence append boundary", async () => {
  const { persistHostStateEvidenceVerification } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification.ts",
  );
  const repository = createRepository();

  const result = await persistHostStateEvidenceVerification(
    "NVL-017",
    {
      evidenceItemId: "scenario-host-state",
      evidenceReference: "",
      reviewerId: "spoofed-reviewer",
      verifiedAt: "2026-09-13T17:00:00.000Z",
    },
    "reviewer-42",
    repository,
    new Date("2026-09-13T16:30:00.000Z"),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.record, null);
  assert.equal(repository.appends.length, 0);
  assert.match(result.errors.join(" "), /authoritative host-state checklist/);
  assert.match(result.errors.join(" "), /source reference is required/);
  assert.match(result.errors.join(" "), /match the authenticated reviewer/);
  assert.match(result.errors.join(" "), /cannot be in the future/);
});

test("repository append failures propagate without reporting a successful verification", async () => {
  const { persistHostStateEvidenceVerification } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification.ts",
  );
  const repository = {
    async read() {
      return [];
    },
    async append() {
      throw new Error("persistence unavailable");
    },
  };

  await assert.rejects(
    persistHostStateEvidenceVerification(
      "NVL-017",
      {
        evidenceItemId: "assignment-letter",
        evidenceReference: "assignment-letter://NVL-017/v1",
        reviewerId: "reviewer-42",
        verifiedAt: "2026-09-13T16:00:00.000Z",
      },
      "reviewer-42",
      repository,
      new Date("2026-09-13T16:30:00.000Z"),
    ),
    /persistence unavailable/,
  );
});
