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
const SURCHARGE_THRESHOLD = 5_000_000;
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

function roundTaxToNearestTenRupees(taxAfterRebatePaise: bigint): number {
  // Add 4% cess exactly as a rational, then ignore paise, matching the Python engine.
  const wholeRupees = Number((taxAfterRebatePaise * 104n) / 10_000n);
  const remainder = wholeRupees % 10;
  return remainder >= 5 ? wholeRupees + (10 - remainder) : wholeRupees - remainder;
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
    "No previous-employer credit, other income, house-property adjustment, special-rate income, or evidence-sensitive deductions",
    "Taxable projected income must remain at or below Rs 50,00,000 because surcharge parity is not enabled in this UAT slice",
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

  if (taxableIncome > SURCHARGE_THRESHOLD) {
    return review(input, grossSalary, "Projected taxable income exceeds the supported no-surcharge UAT range.");
  }

  const slabTax = slabTaxPaise(taxableIncome);
  let rebatePaise = 0n;
  let marginalReliefPaise = 0n;

  if (taxableIncome <= REBATE_THRESHOLD) {
    rebatePaise = slabTax < BigInt(MAX_REBATE * 100) ? slabTax : BigInt(MAX_REBATE * 100);
  } else {
    const excessIncomePaise = BigInt((taxableIncome - REBATE_THRESHOLD) * 100);
    if (slabTax > excessIncomePaise) marginalReliefPaise = slabTax - excessIncomePaise;
  }

  const taxAfterRebatePaise = slabTax - rebatePaise - marginalReliefPaise;
  const annualTaxLiability = roundTaxToNearestTenRupees(taxAfterRebatePaise);
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
