import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lib = await readFile(new URL("../lib/uat-mobility-day-ledger.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/day-ledger/page.tsx", import.meta.url), "utf8");

test("mobility day ledger preserves source evidence and drives SPT", () => {
  assert.match(lib, /assessSubstantialPresence/);
  assert.match(lib, /evidenceStatus/);
  assert.match(lib, /excluded-us-day/);
  assert.match(lib, /pendingEvidence/);
});

test("Aditi day ledger exposes auditability and pending evidence", () => {
  assert.match(page, /Workday & travel ledger/);
  assert.match(page, /Evidence ledger/);
  assert.match(page, /Weighted SPT days/);
  assert.match(page, /Guardian finding/);
});
