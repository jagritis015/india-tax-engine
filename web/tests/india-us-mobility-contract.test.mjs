import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const engine = await readFile(new URL("../lib/us-substantial-presence.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/page.tsx", import.meta.url), "utf8");

test("US substantial presence engine encodes the verified weighted-day mechanism", () => {
  assert.match(engine, /current \* 6 \+ prior \* 2 \+ secondPrior/);
  assert.match(engine, /current >= 31/);
  assert.match(engine, /183 \* 6/);
  assert.match(engine, /REVIEW_REQUIRED/);
  assert.match(engine, /US-SPT-2026-09-IRS/);
});

test("India US mobility page keeps state tax and US monetary tax fail-closed", () => {
  assert.match(page, /U\.S\. host state/);
  assert.match(page, /U\.S\. federal\/state monetary tax engine is not yet verified/);
  assert.match(page, /India–U\.S\. social-security position requires specialist review/);
  assert.match(page, /assessSubstantialPresence/);
  assert.match(page, /Mobility Guardian/);
});

test("India US mobility case links the working mobility workstreams", () => {
  assert.match(page, /Mobility case workstreams/);
  assert.match(page, /\/uat\/mobility\/aditi-india-us\/day-ledger/);
  assert.match(page, /\/uat\/mobility\/aditi-india-us\/compensation/);
  assert.match(page, /\/uat\/mobility\/aditi-india-us\/hypothetical-tax/);
  assert.match(page, /Engine not verified/);
  assert.match(page, /Specialist review/);
});
