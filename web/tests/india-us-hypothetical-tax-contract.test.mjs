import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lib = await readFile(new URL("../lib/uat-india-hypothetical-tax.ts", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/mobility/india-hypothetical-tax/route.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../app/uat/mobility/aditi-india-us/hypothetical-tax/page.tsx", import.meta.url), "utf8");

test("India hypothetical tax reuses deterministic payroll calculation and excludes assignment allowances", () => {
  assert.match(lib, /calculateSupportedUatPayroll/);
  assert.match(lib, /monthlyStayAtHomeGross/);
  assert.match(lib, /Assignment housing and mobility allowances are excluded/);
  assert.match(lib, /niva-india-us-tax-equalization-uat-v1/);
});

test("hypothetical tax API is no-store and does not calculate U.S. monetary tax", () => {
  assert.match(route, /calculateIndiaHypotheticalTax/);
  assert.match(route, /Cache-Control/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /federalTax|stateTax|usTax/i);
});

test("UAT page calls the server route and clearly labels the output as hypothetical policy tax", () => {
  assert.match(page, /fetch\("\/api\/mobility\/india-hypothetical-tax"/);
  assert.match(page, /Calculate hypothetical tax/);
  assert.match(page, /Hypothetical annual India tax/);
  assert.match(page, /not actual India tax due, U\.S\. tax due, or a filed tax position/);
});
