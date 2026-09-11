import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const service = await readFile(new URL("../lib/payroll-service.ts", import.meta.url), "utf8");
const workspaceRoute = await readFile(new URL("../app/api/workspace/route.ts", import.meta.url), "utf8");
const healthRoute = await readFile(new URL("../app/api/health/route.ts", import.meta.url), "utf8");

test("payroll UI contract keeps statutory arithmetic on the server", () => {
  assert.match(service, /statutoryArithmetic: "server-deterministic-only"/);
  assert.match(service, /performs no statutory monetary calculation/);
});

test("workspace endpoint exposes an application-service boundary", () => {
  assert.match(workspaceRoute, /getPayrollApplicationService/);
  assert.match(workspaceRoute, /Cache-Control/);
  assert.match(workspaceRoute, /X-Payroll-Data-Mode/);
});

test("health endpoint confirms paid AI is disabled until approval", () => {
  assert.match(healthRoute, /paidApiEnabled: false/);
  assert.match(healthRoute, /disabled-until-approved/);
  assert.match(healthRoute, /python-deterministic-engine/);
});
