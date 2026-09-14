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
  let reads = 0;

  return {
    appends,
    get reads() {
      return reads;
    },
    async read() {
      reads += 1;
      return [...history];
    },
    async append(caseId, record) {
      appends.push({ caseId, record });
      history.push(record);
    },
  };
}

const enabledPersistence = {
  durableWritesEnabled: true,
  bindingName: "test-durable-store",
};

test("runtime capability remains disabled when storage is not explicitly approved", async () => {
  const { resolveHostStateEvidencePersistenceCapability } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification-service.ts",
  );

  const capability = resolveHostStateEvidencePersistenceCapability({
    approved: false,
    durableBindingPresent: true,
    bindingName: "DB",
  });

  assert.deepEqual(capability, {
    durableWritesEnabled: false,
    bindingName: null,
  });
});

test("runtime capability remains disabled when the approved binding is absent", async () => {
  const { resolveHostStateEvidencePersistenceCapability } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification-service.ts",
  );

  const capability = resolveHostStateEvidencePersistenceCapability({
    approved: true,
    durableBindingPresent: false,
    bindingName: "DB",
  });

  assert.deepEqual(capability, {
    durableWritesEnabled: false,
    bindingName: null,
  });
});

test("runtime capability enables writes only for an approved present named binding", async () => {
  const { resolveHostStateEvidencePersistenceCapability } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification-service.ts",
  );

  const capability = resolveHostStateEvidencePersistenceCapability({
    approved: true,
    durableBindingPresent: true,
    bindingName: "  DB  ",
  });

  assert.deepEqual(capability, {
    durableWritesEnabled: true,
    bindingName: "DB",
  });
});

test("service boundary rejects a blank case identifier before repository access", async () => {
  const { verifyHostStateEvidenceForCase } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification-service.ts",
  );
  const repository = createRepository();

  const result = await verifyHostStateEvidenceForCase(
    "   ",
    {
      evidenceItemId: "assignment-letter",
      evidenceReference: "assignment-letter://NVL-017/v3",
      verifiedAt: "2026-09-14T03:00:00.000Z",
    },
    {
      reviewer: { reviewerId: "server-reviewer-42" },
      repository,
      persistence: enabledPersistence,
    },
    new Date("2026-09-14T03:30:00.000Z"),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.record, null);
  assert.equal(repository.reads, 0);
  assert.equal(repository.appends.length, 0);
  assert.match(result.errors.join(" "), /case identifier is required/i);
});

test("service boundary fails closed before repository access when durable storage is unavailable", async () => {
  const { verifyHostStateEvidenceForCase } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification-service.ts",
  );
  const repository = createRepository();

  const result = await verifyHostStateEvidenceForCase(
    "NVL-017",
    {
      evidenceItemId: "assignment-letter",
      evidenceReference: "assignment-letter://NVL-017/v3",
      verifiedAt: "2026-09-14T03:00:00.000Z",
    },
    {
      reviewer: { reviewerId: "server-reviewer-42" },
      repository,
      persistence: {
        durableWritesEnabled: false,
        bindingName: null,
      },
    },
    new Date("2026-09-14T03:30:00.000Z"),
  );

  assert.equal(result.accepted, false);
  assert.equal(result.record, null);
  assert.equal(repository.reads, 0);
  assert.equal(repository.appends.length, 0);
  assert.match(result.errors.join(" "), /durable verification storage is unavailable/i);
});

test("service boundary normalizes case id and persists only through trusted context", async () => {
  const { verifyHostStateEvidenceForCase } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification-service.ts",
  );
  const repository = createRepository();

  const result = await verifyHostStateEvidenceForCase(
    "  NVL-017  ",
    {
      evidenceItemId: "primary-worksite",
      evidenceReference: "worksite://NVL-017/v3",
      verifiedAt: "2026-09-14T03:00:00.000Z",
      reviewerId: "spoofed-client-reviewer",
    },
    {
      reviewer: { reviewerId: "server-reviewer-42" },
      repository,
      persistence: enabledPersistence,
    },
    new Date("2026-09-14T03:30:00.000Z"),
  );

  assert.equal(result.accepted, true);
  assert.equal(repository.reads, 1);
  assert.equal(repository.appends.length, 1);
  assert.equal(repository.appends[0].caseId, "NVL-017");
  assert.equal(repository.appends[0].record.reviewerId, "server-reviewer-42");
});
