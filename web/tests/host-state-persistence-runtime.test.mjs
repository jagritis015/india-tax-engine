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

test("runtime environment stays fail closed for missing flags", async () => {
  const {
    resolveHostStateEvidencePersistenceRuntimeState,
    inspectHostStateEvidencePersistenceReadiness,
  } = await vite.ssrLoadModule("/lib/uat-host-state-evidence-verification-service.ts");

  const runtime = resolveHostStateEvidencePersistenceRuntimeState({});
  assert.deepEqual(runtime, {
    approved: false,
    durableBindingPresent: false,
    bindingName: null,
  });

  assert.deepEqual(inspectHostStateEvidencePersistenceReadiness(runtime), {
    ready: false,
    reason: "STORAGE_NOT_APPROVED",
    bindingName: null,
  });
});

test("runtime flags require explicit true values", async () => {
  const { resolveHostStateEvidencePersistenceRuntimeState } = await vite.ssrLoadModule(
    "/lib/uat-host-state-evidence-verification-service.ts",
  );

  assert.deepEqual(
    resolveHostStateEvidencePersistenceRuntimeState({
      HOST_STATE_EVIDENCE_STORAGE_APPROVED: "yes",
      HOST_STATE_EVIDENCE_DURABLE_BINDING_PRESENT: "1",
      HOST_STATE_EVIDENCE_STORAGE_BINDING: "DB",
    }),
    {
      approved: false,
      durableBindingPresent: false,
      bindingName: "DB",
    },
  );
});

test("runtime diagnostic reports ready only when every explicit gate is present", async () => {
  const {
    resolveHostStateEvidencePersistenceRuntimeState,
    inspectHostStateEvidencePersistenceReadiness,
  } = await vite.ssrLoadModule("/lib/uat-host-state-evidence-verification-service.ts");

  const runtime = resolveHostStateEvidencePersistenceRuntimeState({
    HOST_STATE_EVIDENCE_STORAGE_APPROVED: " TRUE ",
    HOST_STATE_EVIDENCE_DURABLE_BINDING_PRESENT: "true",
    HOST_STATE_EVIDENCE_STORAGE_BINDING: "  DB  ",
  });

  assert.deepEqual(inspectHostStateEvidencePersistenceReadiness(runtime), {
    ready: true,
    reason: "READY",
    bindingName: "DB",
  });
});
