import test from "node:test";
import assert from "node:assert/strict";
import { calculateSupportedUatPayroll } from "../lib/uat-payroll-calculator.ts";

const base = {
  employeeId: "NVL-UAT-001",
  employeeName: "UAT Employee",
  workState: "Karnataka",
  taxYear: "2026-27",
  payrollMonth: 9,
  taxRegime: "new",
  bonus: 0,
  commission: 0,
  otherTaxableEarnings: 0,
  tdsDeductedYtd: 0,
  pfApplicable: true,
  pfWages: 15000,
};

test("calculates September Karnataka payroll below rebate threshold", () => {
  const result = calculateSupportedUatPayroll({
    ...base,
    basicSalary: 50000,
    hra: 20000,
    specialAllowance: 30000,
    taxableSalaryYtd: 500000,
  });

  assert.equal(result.status, "CALCULATED");
  assert.equal(result.grossSalary, 100000);
  assert.equal(result.projectedSalary, 1200000);
  assert.equal(result.taxableIncome, 1125000);
  assert.equal(result.annualTaxLiability, 0);
  assert.equal(result.tds, 0);
  assert.equal(result.employeePf, 1800);
  assert.equal(result.professionalTax, 200);
  assert.equal(result.totalDeductions, 2000);
  assert.equal(result.netSalary, 98000);
});

test("calculates September TDS from the Python golden annual-tax profile", () => {
  const result = calculateSupportedUatPayroll({
    ...base,
    basicSalary: 100000,
    hra: 40000,
    specialAllowance: 60000,
    taxableSalaryYtd: 1000000,
  });

  assert.equal(result.status, "CALCULATED");
  assert.equal(result.grossSalary, 200000);
  assert.equal(result.projectedSalary, 2400000);
  assert.equal(result.taxableIncome, 2325000);
  assert.equal(result.annualTaxLiability, 292500);
  assert.equal(result.tds, 41786);
  assert.equal(result.employeePf, 1800);
  assert.equal(result.professionalTax, 200);
  assert.equal(result.totalDeductions, 43786);
  assert.equal(result.netSalary, 156214);
});

test("fails closed outside the supported no-surcharge subset", () => {
  const result = calculateSupportedUatPayroll({
    ...base,
    basicSalary: 800000,
    hra: 0,
    specialAllowance: 0,
    taxableSalaryYtd: 0,
  });

  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(result.netSalary, null);
  assert.match(result.reviewReason, /surcharge/i);
});
