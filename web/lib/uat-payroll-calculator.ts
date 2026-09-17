export type UatPayrollCalculationInput = {
  employeeId: string;
  employeeName: string;
  workState: "Karnataka";
  taxYear: "2026-27";
  payrollMonth: 9;
  taxRegime: "new";
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bonus?: number;
  commission?: number;
  otherTaxableEarnings?: number;
  taxableSalaryYtd: number;
  tdsDeductedYtd: number;
  pfApplicable: true;
  pfWages: number;
};

export type UatPayrollCalculationResult = {
  status: "CALCULATED" | "REVIEW_REQUIRED";
  employeeId: string;
  employeeName: string;
  scope: "uat-verified-subset";
  grossSalary: number;
  projectedSalary: number | null;
  taxableIncome: number | null;
  incomeTaxBeforeSurcharge: number | null;
  surchargeRatePercent: number | null;
  surchargeBeforeRelief: number | null;
  surchargeMarginalRelief: number | null;
  surcharge: number | null;
  cess: number | null;
  annualTaxLiability: number | null;
  tds: number | null;
  employeePf: number | null;
  professionalTax: number | null;
  totalDeductions: number | null;
  netSalary: number | null;
  reviewReason: string | null;
  assumptions: string[];
};

const STANDARD_DEDUCTION = 75_000;
const REBATE_THRESHOLD = 1_200_000;
const MAX_REBATE = 60_000;
const PF_WAGE_CEILING = 15_000;
const KARNATAKA_PT_THRESHOLD = 25_000;
const KARNATAKA_NORMAL_MONTHLY_PT = 200;
const REMAINING_MONTHS_INCLUDING_SEPTEMBER = 7;

const NEW_REGIME_SLABS = [
  [0, 400_000, 0],
  [400_000, 800_000, 5],
  [800_000, 1_200_000, 10],
  [1_200_000, 1_600_000, 15],
  [1_600_000, 2_000_000, 20],
  [2_000_000, 2_400_000, 25],
  [2_400_000, null, 30],
] as const;

function assertNonNegativeInteger(name: string, value: number) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative whole-rupee amount`);
  }
}

function slabTaxPaise(taxableIncome: number): bigint {
  let taxPaise = 0n;
  for (const [lower, upper, ratePercent] of NEW_REGIME_SLABS) {
    if (taxableIncome <= lower) break;
    const amount = upper === null
      ? taxableIncome - lower
      : Math.min(taxableIncome - lower, upper - lower);
    // rupees * rate% -> paise exactly because 1% of 1 rupee = 1 paise.
    taxPaise += BigInt(amount * ratePercent);
  }
  return taxPaise;
}

function roundTaxToNearestTenRupees(taxIncludingCessPaise: bigint): number {
  const wholeRupees = Number(taxIncludingCessPaise / 100n);
  const remainder = wholeRupees % 10;
  return remainder >= 5 ? wholeRupees + (10 - remainder) : wholeRupees - remainder;
}

function roundPaiseToRupees(value: bigint): number {
  return Number((value + 50n) / 100n);
}

function taxAfterRebatePaise(taxableIncome: number): bigint {
  const slabTax = slabTaxPaise(taxableIncome);
  if (taxableIncome <= REBATE_THRESHOLD) {
    const rebate = slabTax < BigInt(MAX_REBATE * 100) ? slabTax : BigInt(MAX_REBATE * 100);
    return slabTax - rebate;
  }
  const excessIncomePaise = BigInt((taxableIncome - REBATE_THRESHOLD) * 100);
  const rebateMarginalRelief = slabTax > excessIncomePaise ? slabTax - excessIncomePaise : 0n;
  return slabTax - rebateMarginalRelief;
}

function surchargeRatePercent(taxableIncome: number): number {
  if (taxableIncome <= 5_000_000) return 0;
  if (taxableIncome <= 10_000_000) return 10;
  if (taxableIncome <= 20_000_000) return 15;
  return 25;
}

function precedingSurchargeThreshold(taxableIncome: number): number | null {
  if (taxableIncome > 20_000_000) return 20_000_000;
  if (taxableIncome > 10_000_000) return 10_000_000;
  if (taxableIncome > 5_000_000) return 5_000_000;
  return null;
}

function surchargeAtIncomePaise(taxableIncome: number, taxAfterRebate: bigint) {
  const ratePercent = surchargeRatePercent(taxableIncome);
  const beforeRelief = (taxAfterRebate * BigInt(ratePercent)) / 100n;
  const threshold = precedingSurchargeThreshold(taxableIncome);
  let marginalRelief = 0n;

  if (threshold !== null) {
    const thresholdTax = taxAfterRebatePaise(threshold);
    const thresholdRate = surchargeRatePercent(threshold);
    const thresholdSurcharge = (thresholdTax * BigInt(thresholdRate)) / 100n;
    const maximumTaxAndSurcharge = thresholdTax
      + thresholdSurcharge
      + BigInt((taxableIncome - threshold) * 100);
    const actualTaxAndSurcharge = taxAfterRebate + beforeRelief;
    if (actualTaxAndSurcharge > maximumTaxAndSurcharge) {
      marginalRelief = actualTaxAndSurcharge - maximumTaxAndSurcharge;
    }
  }

  return {
    ratePercent,
    beforeRelief,
    marginalRelief,
    surcharge: beforeRelief - marginalRelief,
  };
}

function roundHalfUpDivision(numerator: number, denominator: number): number {
  const quotient = Math.floor(numerator / denominator);
  const remainder = numerator % denominator;
  return remainder * 2 >= denominator ? quotient + 1 : quotient;
}

function review(input: UatPayrollCalculationInput, grossSalary: number, reason: string): UatPayrollCalculationResult {
  return {
    status: "REVIEW_REQUIRED",
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    scope: "uat-verified-subset",
    grossSalary,
    projectedSalary: null,
    taxableIncome: null,
    incomeTaxBeforeSurcharge: null,
    surchargeRatePercent: null,
    surchargeBeforeRelief: null,
    surchargeMarginalRelief: null,
    surcharge: null,
    cess: null,
    annualTaxLiability: null,
    tds: null,
    employeePf: null,
    professionalTax: null,
    totalDeductions: null,
    netSalary: null,
    reviewReason: reason,
    assumptions: supportedAssumptions(),
  };
}

function supportedAssumptions() {
  return [
    "Tax year 2026-27",
    "September payroll month",
    "New tax regime, resident individual",
    "Karnataka Professional Tax",
    "Standard employee PF at 12% with Rs 15,000 wage ceiling",
    "Salary income only; no previous-employer credit, other income, house-property adjustment, special-rate income, or evidence-sensitive deductions",
    "New-regime surcharge at 10%, 15%, or 25% with marginal relief at Rs 50 lakh, Rs 1 crore, and Rs 2 crore",
    "Health and Education Cess at 4% on income tax plus surcharge after marginal relief",
  ];
}

export function calculateSupportedUatPayroll(input: UatPayrollCalculationInput): UatPayrollCalculationResult {
  const numericInputs = {
    basicSalary: input.basicSalary,
    hra: input.hra,
    specialAllowance: input.specialAllowance,
    bonus: input.bonus ?? 0,
    commission: input.commission ?? 0,
    otherTaxableEarnings: input.otherTaxableEarnings ?? 0,
    taxableSalaryYtd: input.taxableSalaryYtd,
    tdsDeductedYtd: input.tdsDeductedYtd,
    pfWages: input.pfWages,
  };

  for (const [name, value] of Object.entries(numericInputs)) {
    assertNonNegativeInteger(name, value);
  }

  const grossSalary = numericInputs.basicSalary
    + numericInputs.hra
    + numericInputs.specialAllowance
    + numericInputs.bonus
    + numericInputs.commission
    + numericInputs.otherTaxableEarnings;

  if (input.taxYear !== "2026-27" || input.payrollMonth !== 9 || input.taxRegime !== "new" || input.workState !== "Karnataka") {
    return review(input, grossSalary, "This UAT calculator currently supports only September 2026, Karnataka, and the new tax regime.");
  }

  if (input.pfApplicable !== true) {
    return review(input, grossSalary, "PF applicability must be explicitly confirmed for this supported UAT path.");
  }

  const projectedSalary = numericInputs.taxableSalaryYtd
    + grossSalary * REMAINING_MONTHS_INCLUDING_SEPTEMBER;
  const taxableIncome = Math.max(0, projectedSalary - STANDARD_DEDUCTION);

  const incomeTaxPaise = taxAfterRebatePaise(taxableIncome);
  const surchargeResult = surchargeAtIncomePaise(taxableIncome, incomeTaxPaise);
  const taxPlusSurchargePaise = incomeTaxPaise + surchargeResult.surcharge;
  const cessPaise = (taxPlusSurchargePaise * 4n) / 100n;
  const annualTaxLiability = roundTaxToNearestTenRupees(taxPlusSurchargePaise + cessPaise);
  const remainingTax = Math.max(0, annualTaxLiability - numericInputs.tdsDeductedYtd);
  const tds = roundHalfUpDivision(remainingTax, REMAINING_MONTHS_INCLUDING_SEPTEMBER);

  const pfContributionBase = Math.min(numericInputs.pfWages, PF_WAGE_CEILING);
  const employeePf = roundHalfUpDivision(pfContributionBase * 12, 100);
  const professionalTax = grossSalary < KARNATAKA_PT_THRESHOLD ? 0 : KARNATAKA_NORMAL_MONTHLY_PT;
  const totalDeductions = tds + employeePf + professionalTax;
  const netSalary = grossSalary - totalDeductions;

  return {
    status: "CALCULATED",
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    scope: "uat-verified-subset",
    grossSalary,
    projectedSalary,
    taxableIncome,
    incomeTaxBeforeSurcharge: roundPaiseToRupees(incomeTaxPaise),
    surchargeRatePercent: surchargeResult.ratePercent,
    surchargeBeforeRelief: roundPaiseToRupees(surchargeResult.beforeRelief),
    surchargeMarginalRelief: roundPaiseToRupees(surchargeResult.marginalRelief),
    surcharge: roundPaiseToRupees(surchargeResult.surcharge),
    cess: roundPaiseToRupees(cessPaise),
    annualTaxLiability,
    tds,
    employeePf,
    professionalTax,
    totalDeductions,
    netSalary,
    reviewReason: null,
    assumptions: supportedAssumptions(),
  };
}
