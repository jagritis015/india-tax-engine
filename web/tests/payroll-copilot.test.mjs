import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

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

const { answerPayrollCopilot } = await vite.ssrLoadModule("/lib/uat-payroll-copilot.ts");

const context = {
  employeeCount: 100,
  payrollStatus: "Draft",
  openIssues: [
    { employee: "Aditi Joshi", employeeId: "NVL-017", issue: "Payroll input requires review", severity: "High" },
    { employee: "Pooja Sharma", employeeId: "NVL-042", issue: "Professional Tax work location requires review", severity: "Blocker" },
  ],
};

test("answers typed blocker questions from current UAT state", () => {
  const answer = answerPayrollCopilot("Why can't I submit payroll?", context);
  assert.match(answer, /NVL-042/);
  assert.match(answer, /Pooja Sharma/);
  assert.match(answer, /blocking approval/);
});

test("routes statutory questions to the deterministic calculation service", () => {
  const answer = answerPayrollCopilot("Explain TDS, PF and PT", context);
  assert.match(answer, /deterministic payroll service/);
  assert.match(answer, /calculation lineage/);
  assert.doesNotMatch(answer, /I calculated/);
});

test("explains the India to United States mobility blockers", () => {
  const answer = answerPayrollCopilot("What is blocking Aditi's US mobility case?", context);
  assert.match(answer, /U\.S\. host state/);
  assert.match(answer, /four evidence or specialist reviews/);
});

test("fails closed for unsupported questions", () => {
  const answer = answerPayrollCopilot("Draft a customer contract", context);
  assert.match(answer, /cannot answer that reliably/);
  assert.match(answer, /zero-cost deterministic mode/);
});

test("renders a typed-question composer and explicit no-paid-AI disclosure", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /aria-label="Ask Payroll Copilot"/);
  assert.match(page, /placeholder="Ask about payroll or mobility"/);
  assert.match(page, /No paid AI is connected/);
  assert.match(page, /never calculate statutory money/);
});
