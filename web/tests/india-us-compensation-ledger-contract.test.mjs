import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lib = await readFile(new URL("../lib/uat-global-compensation-ledger.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/compensation/page.tsx", import.meta.url), "utf8");

test("global compensation ledger separates compensation from tax/payroll treatment", () => {
  assert.match(lib, /policyIncludedInHypo/);
  assert.match(lib, /home-payroll/);
  assert.match(lib, /shadow-payroll/);
  assert.match(lib, /evidenceStatus/);
  assert.match(lib, /jurisdiction:\"Review\"/);
});

test("Aditi compensation page exposes fail-closed treatment", () => {
  assert.match(page, /Global compensation ledger/);
  assert.match(page, /Fail-closed behavior/);
  assert.match(page, /review-required/);
  assert.match(page, /India hypo policy/);
});
