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

test("calculates 10 percent surcharge above Rs 50 lakh with marginal relief", () => {
  const result = calculateSupportedUatPayroll({
    ...base,
    basicSalary: 715000,
    hra: 0,
    specialAllowance: 0,
    taxableSalaryYtd: 75000,
  });

  assert.equal(result.status, "CALCULATED");
  assert.equal(result.taxableIncome, 5005000);
  assert.equal(result.surchargeRatePercent, 10);
  assert.equal(result.surchargeBeforeRelief, 108150);
  assert.equal(result.surchargeMarginalRelief, 104650);
  assert.equal(result.surcharge, 3500);
  assert.equal(result.cess, 43400);
  assert.equal(result.annualTaxLiability, 1128400);
});

test("uses 15 percent above Rs 1 crore and applies threshold marginal relief", () => {
  const result = calculateSupportedUatPayroll({ ...base, basicSalary: 1430000, hra: 0, specialAllowance: 0, taxableSalaryYtd: 0 });
  assert.equal(result.status, "CALCULATED");
  assert.equal(result.taxableIncome, 9935000);
  assert.equal(result.surchargeRatePercent, 10);

  const above = calculateSupportedUatPayroll({ ...base, basicSalary: 1440000, hra: 0, specialAllowance: 0, taxableSalaryYtd: 0 });
  assert.equal(above.taxableIncome, 10005000);
  assert.equal(above.surchargeRatePercent, 15);
  assert.ok(above.surchargeMarginalRelief > 0);
});

test("caps new-regime salary surcharge at 25 percent above Rs 2 crore and Rs 5 crore", () => {
  const aboveTwoCrore = calculateSupportedUatPayroll({ ...base, basicSalary: 2870000, hra: 0, specialAllowance: 0, taxableSalaryYtd: 0 });
  assert.equal(aboveTwoCrore.taxableIncome, 20015000);
  assert.equal(aboveTwoCrore.surchargeRatePercent, 25);
  assert.ok(aboveTwoCrore.surchargeMarginalRelief > 0);

  const aboveFiveCrore = calculateSupportedUatPayroll({ ...base, basicSalary: 7165000, hra: 0, specialAllowance: 0, taxableSalaryYtd: 0 });
  assert.equal(aboveFiveCrore.surchargeRatePercent, 25);
  assert.equal(aboveFiveCrore.surchargeMarginalRelief, 0);
});
