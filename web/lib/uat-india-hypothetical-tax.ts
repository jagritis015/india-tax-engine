import { calculateSupportedUatPayroll } from "./uat-payroll-calculator";

export type IndiaHypotheticalTaxInput = {
  employeeId: string;
  employeeName: string;
  monthlyStayAtHomeGross: number;
  taxableSalaryYtd: number;
  tdsDeductedYtd: number;
};

export type IndiaHypotheticalTaxResult = {
  status: "CALCULATED" | "REVIEW_REQUIRED";
  policyVersion: "niva-india-us-tax-equalization-uat-v1";
  employeeId: string;
  employeeName: string;
  stayAtHomeMonthlyGross: number;
  projectedStayAtHomeSalary: number | null;
  hypotheticalTaxableIncome: number | null;
  hypotheticalAnnualIndiaTax: number | null;
  hypotheticalMonthlyWithholding: number | null;
  reviewReason: string | null;
  policyAssumptions: string[];
};

const POLICY_VERSION = "niva-india-us-tax-equalization-uat-v1" as const;

function wholeRupees(name: string, value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${name} must be a non-negative whole-rupee amount`);
}

export function calculateIndiaHypotheticalTax(input: IndiaHypotheticalTaxInput): IndiaHypotheticalTaxResult {
  wholeRupees("monthlyStayAtHomeGross", input.monthlyStayAtHomeGross);
  wholeRupees("taxableSalaryYtd", input.taxableSalaryYtd);
  wholeRupees("tdsDeductedYtd", input.tdsDeductedYtd);

  const basicSalary = Math.floor(input.monthlyStayAtHomeGross * 45 / 100);
  const hra = Math.floor(basicSalary * 50 / 100);
  const specialAllowance = input.monthlyStayAtHomeGross - basicSalary - hra;

  const payroll = calculateSupportedUatPayroll({
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    workState: "Karnataka",
    taxYear: "2026-27",
    payrollMonth: 9,
    taxRegime: "new",
    basicSalary,
    hra,
    specialAllowance,
    taxableSalaryYtd: input.taxableSalaryYtd,
    tdsDeductedYtd: input.tdsDeductedYtd,
    pfApplicable: true,
    pfWages: Math.min(basicSalary, 15_000),
  });

  const policyAssumptions = [
    "Controlled UAT mobility policy only",
    "Hypothetical tax uses stay-at-home India compensation, not assignment allowances",
    "Home location is Bengaluru, Karnataka",
    "Tax year 2026-27 and new regime",
    "No spouse income, investment income, previous-employer credit or evidence-sensitive deductions",
    "Assignment housing and mobility allowances are excluded from hypothetical home-country compensation in this UAT policy",
    "Actual India or U.S. tax is not replaced by this hypothetical-tax result",
  ];

  if (payroll.status !== "CALCULATED") {
    return {
      status: "REVIEW_REQUIRED",
      policyVersion: POLICY_VERSION,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      stayAtHomeMonthlyGross: input.monthlyStayAtHomeGross,
      projectedStayAtHomeSalary: null,
      hypotheticalTaxableIncome: null,
      hypotheticalAnnualIndiaTax: null,
      hypotheticalMonthlyWithholding: null,
      reviewReason: payroll.reviewReason ?? "India hypothetical-tax path requires review.",
      policyAssumptions,
    };
  }

  return {
    status: "CALCULATED",
    policyVersion: POLICY_VERSION,
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    stayAtHomeMonthlyGross: input.monthlyStayAtHomeGross,
    projectedStayAtHomeSalary: payroll.projectedSalary,
    hypotheticalTaxableIncome: payroll.taxableIncome,
    hypotheticalAnnualIndiaTax: payroll.annualTaxLiability,
    hypotheticalMonthlyWithholding: payroll.tds,
    reviewReason: null,
    policyAssumptions,
  };
}
