import { UAT_COMPANY, UAT_EMPLOYEES, type UatEmployee } from "./uat-niva-data";
import {
  calculateSupportedUatPayroll,
  type UatPayrollCalculationInput,
  type UatPayrollCalculationResult,
} from "./uat-payroll-calculator";
import {
  REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT,
  assessImmigrationSupport,
  type ImmigrationSupportInput,
} from "./uat-immigration-support";

export type PayrollScenarioId =
  | "monthly-baseline-100"
  | "festival-variable-pay-100"
  | "new-joiner-proration-6"
  | "statutory-boundaries-7"
  | "tds-true-up-4"
  | "fail-closed-controls-4";

export type ScenarioId = PayrollScenarioId | "immigration-controls-8";

export type EmployeeMasterRecord = {
  employeeId: string;
  fullName: string;
  workEmail: string;
  department: string;
  role: string;
  costCenter: string;
  managerId: string;
  workLocation: string;
  employmentType: "Full time";
  dateOfJoining: string;
  syntheticPan: string;
  syntheticUan: string;
  maskedBankAccount: string;
  bankIfsc: string;
  taxRegime: "New";
  pfApplicable: "Yes";
  monthlyGross: number;
  sourceStatus: UatEmployee["status"];
};

export type PayrollScenarioInput = UatPayrollCalculationInput & {
  scenarioId: PayrollScenarioId;
  role: string;
  department: string;
  eventType: string;
  payableDays: number;
  sourceStatus: UatEmployee["status"];
};

export type PayrollScenarioResult = Omit<UatPayrollCalculationResult, "status"> & {
  scenarioId: PayrollScenarioId;
  role: string;
  department: string;
  eventType: string;
  payableDays: number;
  sourceStatus: UatEmployee["status"];
  status: "CALCULATED" | "REVIEW_REQUIRED" | "BLOCKED";
};

type PayrollSummary = {
  employeeCount: number;
  calculatedCount: number;
  reviewCount: number;
  blockedCount: number;
  grossPayroll: number;
  totalTds: number;
  totalEmployeePf: number;
  totalProfessionalTax: number;
  totalDeductions: number;
  netPayable: number;
};

export type ScenarioCheck = {
  label: string;
  expected: string | number;
  actual: string | number;
  passed: boolean;
};

export type PayrollScenarioRun = {
  id: PayrollScenarioId;
  kind: "payroll";
  label: string;
  description: string;
  expected: PayrollSummary;
  actual: PayrollSummary;
  checks: ScenarioCheck[];
  allChecksPassed: boolean;
  rows: PayrollScenarioResult[];
};

export type ImmigrationScenarioRecord = {
  scenarioId: string;
  label: string;
  expectedStatus: "PRECHECK_COMPLETE" | "ACTION_REQUIRED" | "BLOCKED";
  input: ImmigrationSupportInput;
};

export type ImmigrationScenarioRun = {
  id: "immigration-controls-8";
  kind: "immigration";
  label: string;
  description: string;
  expected: { caseCount: number; completeCount: number; actionRequiredCount: number; blockedCount: number };
  actual: { caseCount: number; completeCount: number; actionRequiredCount: number; blockedCount: number };
  checks: ScenarioCheck[];
  allChecksPassed: boolean;
  rows: Array<ImmigrationScenarioRecord & {
    actualStatus: "PRECHECK_COMPLETE" | "ACTION_REQUIRED" | "BLOCKED";
    matchedExpected: boolean;
    passedGates: number;
    totalGates: number;
    openActions: number;
    criticalAlerts: number;
    nextAction: string;
  }>;
};

export type ScenarioRun = PayrollScenarioRun | ImmigrationScenarioRun;

const roleProfile: Record<string, { department: string; costCenter: string; managerId: string }> = {
  "Finance Analyst": { department: "Finance", costCenter: "FIN-110", managerId: "NVL-014" },
  "Payroll Specialist": { department: "Finance", costCenter: "FIN-120", managerId: "NVL-010" },
  "HR Executive": { department: "People", costCenter: "PPL-210", managerId: "NVL-057" },
  "Sales Manager": { department: "Revenue", costCenter: "REV-310", managerId: "NVL-037" },
  "Account Executive": { department: "Revenue", costCenter: "REV-320", managerId: "NVL-015" },
  "Software Engineer": { department: "Engineering", costCenter: "ENG-410", managerId: "NVL-020" },
  "Senior Software Engineer": { department: "Engineering", costCenter: "ENG-420", managerId: "NVL-020" },
  "QA Engineer": { department: "Engineering", costCenter: "ENG-430", managerId: "NVL-009" },
  "Product Manager": { department: "Product", costCenter: "PRD-510", managerId: "NVL-023" },
  "Product Designer": { department: "Product", costCenter: "PRD-520", managerId: "NVL-017" },
  "Operations Executive": { department: "Operations", costCenter: "OPS-610", managerId: "NVL-018" },
};

const locations = ["Bengaluru, Karnataka", "Bengaluru, Karnataka", "Mysuru, Karnataka", "Mangaluru, Karnataka"];

function emailName(name: string) {
  return name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
}

export function buildEmployeeMaster(): EmployeeMasterRecord[] {
  return UAT_EMPLOYEES.map((employee, offset) => {
    const index = offset + 1;
    const profile = roleProfile[employee.role] ?? { department: "Operations", costCenter: "OPS-699", managerId: "NVL-018" };
    const year = 2019 + (index % 8);
    const month = String((index % 12) + 1).padStart(2, "0");
    const day = String((index % 24) + 1).padStart(2, "0");
    const panNumber = String(index).padStart(4, "0");
    return {
      employeeId: employee.id,
      fullName: employee.name,
      workEmail: `${emailName(employee.name)}.${employee.id.slice(-3)}@nivalabs.example`,
      department: profile.department,
      role: employee.role,
      costCenter: profile.costCenter,
      managerId: profile.managerId === employee.id ? "NVL-001" : profile.managerId,
      workLocation: locations[index % locations.length],
      employmentType: "Full time",
      dateOfJoining: `${year}-${month}-${day}`,
      syntheticPan: `UATPA${panNumber}${String.fromCharCode(65 + (index % 26))}`,
      syntheticUan: `99000000${panNumber}`,
      maskedBankAccount: `XXXXXX${String(4100 + index).slice(-4)}`,
      bankIfsc: `HDFC000${String(1000 + (index % 20)).slice(-4)}`,
      taxRegime: "New",
      pfApplicable: "Yes",
      monthlyGross: employee.gross,
      sourceStatus: employee.status,
    };
  });
}

function salaryComponents(gross: number, extras: { bonus?: number; commission?: number; other?: number } = {}) {
  const bonus = extras.bonus ?? 0;
  const commission = extras.commission ?? 0;
  const otherTaxableEarnings = extras.other ?? 0;
  const fixedGross = gross - bonus - commission - otherTaxableEarnings;
  const basicSalary = Math.round(fixedGross * 0.45);
  const hra = Math.round(basicSalary * 0.5);
  const specialAllowance = fixedGross - basicSalary - hra;
  return { basicSalary, hra, specialAllowance, bonus, commission, otherTaxableEarnings };
}

function makeInput(args: {
  scenarioId: PayrollScenarioId;
  employeeId: string;
  employeeName: string;
  role: string;
  gross: number;
  eventType: string;
  payableDays?: number;
  taxableSalaryYtd?: number;
  tdsDeductedYtd?: number;
  pfWages?: number;
  sourceStatus?: UatEmployee["status"];
  extras?: { bonus?: number; commission?: number; other?: number };
}): PayrollScenarioInput {
  const profile = roleProfile[args.role] ?? { department: "Operations", costCenter: "OPS-699", managerId: "NVL-018" };
  const components = salaryComponents(args.gross, args.extras);
  return {
    scenarioId: args.scenarioId,
    employeeId: args.employeeId,
    employeeName: args.employeeName,
    role: args.role,
    department: profile.department,
    eventType: args.eventType,
    payableDays: args.payableDays ?? 30,
    sourceStatus: args.sourceStatus ?? "Ready",
    workState: "Karnataka",
    taxYear: "2026-27",
    payrollMonth: 9,
    taxRegime: "new",
    ...components,
    taxableSalaryYtd: args.taxableSalaryYtd ?? args.gross * 5,
    tdsDeductedYtd: args.tdsDeductedYtd ?? 0,
    pfApplicable: true,
    pfWages: args.pfWages ?? Math.min(components.basicSalary, 15_000),
  };
}

function baselineInputs(scenarioId: PayrollScenarioId, variablePay = false): PayrollScenarioInput[] {
  return UAT_EMPLOYEES.map((employee, index) => {
    const isSales = employee.role === "Sales Manager" || employee.role === "Account Executive";
    const bonus = variablePay && index % 10 === 0 ? 25_000 + (index % 4) * 5_000 : 0;
    const commission = variablePay && isSales ? 12_000 + (index % 5) * 3_000 : 0;
    return makeInput({
      scenarioId,
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      gross: employee.gross + bonus + commission,
      eventType: variablePay ? (bonus || commission ? "Festival bonus or sales commission" : "Regular payroll") : "Regular payroll",
      taxableSalaryYtd: employee.gross * 5,
      sourceStatus: employee.status,
      extras: { bonus, commission },
    });
  });
}

function newJoinerInputs(): PayrollScenarioInput[] {
  const records = [
    ["UAT-J01", "Ira Krishnan", "Software Engineer", 72_000, 18],
    ["UAT-J02", "Ritvik Malhotra", "Finance Analyst", 54_000, 20],
    ["UAT-J03", "Maya Fernandes", "Account Executive", 61_500, 15],
    ["UAT-J04", "Amanpreet Kaur", "QA Engineer", 48_000, 16],
    ["UAT-J05", "Harini Subramanian", "Product Designer", 82_000, 21],
    ["UAT-J06", "Rehan Siddiqui", "Operations Executive", 35_000, 14],
  ] as const;
  return records.map(([employeeId, employeeName, role, payableGross, payableDays]) => makeInput({
    scenarioId: "new-joiner-proration-6",
    employeeId,
    employeeName,
    role,
    gross: payableGross,
    eventType: `New joiner with ${payableDays} payable days; salary components already prorated`,
    payableDays,
    taxableSalaryYtd: 0,
  }));
}

function boundaryInputs(): PayrollScenarioInput[] {
  const records = [
    ["UAT-B01", "PT below threshold", 24_999, 14_000, 124_995, "Karnataka PT boundary at Rs 24,999"],
    ["UAT-B02", "PT at threshold", 25_000, 14_000, 125_000, "Karnataka PT boundary at Rs 25,000"],
    ["UAT-B03", "PF below ceiling", 80_000, 14_999, 400_000, "PF wages at Rs 14,999"],
    ["UAT-B04", "PF at ceiling", 80_000, 15_000, 400_000, "PF wages at Rs 15,000"],
    ["UAT-B05", "PF above ceiling", 80_000, 28_000, 400_000, "PF wages above the Rs 15,000 ceiling"],
    ["UAT-B06", "Rebate threshold", 100_000, 15_000, 575_000, "Taxable income at the rebate threshold"],
    ["UAT-B07", "Marginal relief", 100_000, 15_000, 576_000, "Taxable income just above the rebate threshold"],
  ] as const;
  return records.map(([employeeId, employeeName, gross, pfWages, taxableSalaryYtd, eventType]) => makeInput({
    scenarioId: "statutory-boundaries-7",
    employeeId,
    employeeName,
    role: "Finance Analyst",
    gross,
    pfWages,
    taxableSalaryYtd,
    eventType,
  }));
}

function tdsTrueUpInputs(): PayrollScenarioInput[] {
  const records = [
    ["UAT-T01", "Zero prior TDS", 200_000, 1_000_000, 0],
    ["UAT-T02", "Partial prior TDS", 200_000, 1_000_000, 75_000],
    ["UAT-T03", "High prior TDS", 200_000, 1_000_000, 150_000],
    ["UAT-T04", "Prior TDS covers liability", 150_000, 750_000, 250_000],
  ] as const;
  return records.map(([employeeId, employeeName, gross, taxableSalaryYtd, tdsDeductedYtd]) => makeInput({
    scenarioId: "tds-true-up-4",
    employeeId,
    employeeName,
    role: "Finance Analyst",
    gross,
    taxableSalaryYtd,
    tdsDeductedYtd,
    eventType: "September TDS true up using salary and TDS year to date",
  }));
}

function failClosedInputs(): PayrollScenarioInput[] {
  const highEarner = makeInput({
    scenarioId: "fail-closed-controls-4",
    employeeId: "UAT-F01",
    employeeName: "Unsupported surcharge case",
    role: "Sales Manager",
    gross: 500_000,
    taxableSalaryYtd: 2_000_000,
    eventType: "Projected taxable income exceeds the verified no-surcharge range",
  });
  const invalidNegative = makeInput({
    scenarioId: "fail-closed-controls-4",
    employeeId: "UAT-F02",
    employeeName: "Negative earnings input",
    role: "Finance Analyst",
    gross: 90_000,
    eventType: "Negative bonus must be blocked",
  });
  invalidNegative.bonus = -1;
  const reviewMaster = makeInput({
    scenarioId: "fail-closed-controls-4",
    employeeId: "UAT-F03",
    employeeName: "Unresolved employee master",
    role: "HR Executive",
    gross: 95_000,
    eventType: "Employee master requires review before payroll",
    sourceStatus: "Needs review",
  });
  const blockedMaster = makeInput({
    scenarioId: "fail-closed-controls-4",
    employeeId: "UAT-F04",
    employeeName: "Blocked work location",
    role: "Operations Executive",
    gross: 75_000,
    eventType: "Work location blocks state Professional Tax",
    sourceStatus: "Blocked",
  });
  return [highEarner, invalidNegative, reviewMaster, blockedMaster];
}

export function getPayrollScenarioInputs(id: PayrollScenarioId): PayrollScenarioInput[] {
  if (id === "monthly-baseline-100") return baselineInputs(id);
  if (id === "festival-variable-pay-100") return baselineInputs(id, true);
  if (id === "new-joiner-proration-6") return newJoinerInputs();
  if (id === "statutory-boundaries-7") return boundaryInputs();
  if (id === "tds-true-up-4") return tdsTrueUpInputs();
  return failClosedInputs();
}

function reviewFromSource(input: PayrollScenarioInput): UatPayrollCalculationResult {
  return {
    status: "REVIEW_REQUIRED",
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    scope: "uat-verified-subset",
    grossSalary: input.basicSalary + input.hra + input.specialAllowance + (input.bonus ?? 0) + (input.commission ?? 0) + (input.otherTaxableEarnings ?? 0),
    projectedSalary: null,
    taxableIncome: null,
    annualTaxLiability: null,
    tds: null,
    employeePf: null,
    professionalTax: null,
    totalDeductions: null,
    netSalary: null,
    reviewReason: input.sourceStatus === "Blocked"
      ? "Employee master contains a blocking payroll exception that must be resolved before calculation."
      : "Employee master requires payroll-input review before calculation.",
    assumptions: [],
  };
}

function calculateScenarioRow(input: PayrollScenarioInput): PayrollScenarioResult {
  let result: UatPayrollCalculationResult | (Omit<UatPayrollCalculationResult, "status"> & { status: "BLOCKED" });
  try {
    result = input.sourceStatus === "Ready" ? calculateSupportedUatPayroll(input) : reviewFromSource(input);
  } catch (error) {
    const grossSalary = input.basicSalary + input.hra + input.specialAllowance + (input.bonus ?? 0) + (input.commission ?? 0) + (input.otherTaxableEarnings ?? 0);
    result = {
      status: "BLOCKED",
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
      reviewReason: error instanceof Error ? error.message : "Invalid payroll input",
      assumptions: [],
    };
  }
  return {
    ...result,
    scenarioId: input.scenarioId,
    role: input.role,
    department: input.department,
    eventType: input.eventType,
    payableDays: input.payableDays,
    sourceStatus: input.sourceStatus,
  };
}

function summarizePayroll(rows: PayrollScenarioResult[]): PayrollSummary {
  const calculated = rows.filter((row) => row.status === "CALCULATED");
  const sum = (key: "grossSalary" | "tds" | "employeePf" | "professionalTax" | "totalDeductions" | "netSalary") => calculated.reduce((total, row) => total + (row[key] ?? 0), 0);
  return {
    employeeCount: rows.length,
    calculatedCount: calculated.length,
    reviewCount: rows.filter((row) => row.status === "REVIEW_REQUIRED").length,
    blockedCount: rows.filter((row) => row.status === "BLOCKED").length,
    grossPayroll: sum("grossSalary"),
    totalTds: sum("tds"),
    totalEmployeePf: sum("employeePf"),
    totalProfessionalTax: sum("professionalTax"),
    totalDeductions: sum("totalDeductions"),
    netPayable: sum("netSalary"),
  };
}

const payrollLabels: Record<PayrollScenarioId, { label: string; description: string }> = {
  "monthly-baseline-100": { label: "September monthly payroll", description: "Full Niva Labs 100 employee run with three unresolved source records kept out of calculated totals." },
  "festival-variable-pay-100": { label: "Festival bonus and sales commission", description: "Full company run with bonus and commission events layered onto regular salary while preserving source exceptions." },
  "new-joiner-proration-6": { label: "Six new joiners", description: "Prorated September salary inputs for employees joining on different dates with no prior salary year to date." },
  "statutory-boundaries-7": { label: "PT, PF and rebate boundaries", description: "Exact threshold tests for Karnataka Professional Tax, the PF wage ceiling, rebate and marginal relief behavior." },
  "tds-true-up-4": { label: "TDS year-to-date true up", description: "Same current salary with different prior TDS credits to prove the remaining liability changes deterministically." },
  "fail-closed-controls-4": { label: "Fail-closed payroll controls", description: "Unsupported surcharge, negative input, review-required master and blocked work-location cases." },
};

const EXPECTED_PAYROLL_SUMMARIES: Record<PayrollScenarioId, PayrollSummary> = {
  "monthly-baseline-100": { employeeCount: 100, calculatedCount: 97, reviewCount: 3, blockedCount: 0, grossPayroll: 13_151_000, totalTds: 1_662_339, totalEmployeePf: 174_600, totalProfessionalTax: 19_400, totalDeductions: 1_856_339, netPayable: 11_294_661 },
  "festival-variable-pay-100": { employeeCount: 100, calculatedCount: 97, reviewCount: 3, blockedCount: 0, grossPayroll: 13_730_000, totalTds: 1_815_622, totalEmployeePf: 174_600, totalProfessionalTax: 19_400, totalDeductions: 2_009_622, netPayable: 11_720_378 },
  "new-joiner-proration-6": { employeeCount: 6, calculatedCount: 6, reviewCount: 0, blockedCount: 0, grossPayroll: 352_500, totalTds: 0, totalEmployeePf: 10_800, totalProfessionalTax: 1_200, totalDeductions: 12_000, netPayable: 340_500 },
  "statutory-boundaries-7": { employeeCount: 7, calculatedCount: 7, reviewCount: 0, blockedCount: 0, grossPayroll: 489_999, totalTds: 149, totalEmployeePf: 12_360, totalProfessionalTax: 1_200, totalDeductions: 13_709, netPayable: 476_290 },
  "tds-true-up-4": { employeeCount: 4, calculatedCount: 4, reviewCount: 0, blockedCount: 0, grossPayroll: 750_000, totalTds: 93_214, totalEmployeePf: 7_200, totalProfessionalTax: 800, totalDeductions: 101_214, netPayable: 648_786 },
  "fail-closed-controls-4": { employeeCount: 4, calculatedCount: 0, reviewCount: 3, blockedCount: 1, grossPayroll: 0, totalTds: 0, totalEmployeePf: 0, totalProfessionalTax: 0, totalDeductions: 0, netPayable: 0 },
};

function summaryChecks(expected: PayrollSummary, actual: PayrollSummary): ScenarioCheck[] {
  return (Object.keys(expected) as Array<keyof PayrollSummary>).map((key) => ({
    label: key,
    expected: expected[key],
    actual: actual[key],
    passed: expected[key] === actual[key],
  }));
}

export function runPayrollScenario(id: PayrollScenarioId): PayrollScenarioRun {
  const rows = getPayrollScenarioInputs(id).map(calculateScenarioRow);
  const actual = summarizePayroll(rows);
  const expected = EXPECTED_PAYROLL_SUMMARIES[id];
  const checks = summaryChecks(expected, actual);
  return { id, kind: "payroll", ...payrollLabels[id], expected, actual, checks, allChecksPassed: checks.every((check) => check.passed), rows };
}

function immigrationInput(scenarioId: string, overrides: Partial<ImmigrationSupportInput>): ImmigrationSupportInput {
  return { ...REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT, caseId: `MOB-UAT-${scenarioId.toUpperCase()}`, ...overrides };
}

export const IMMIGRATION_SCENARIOS: ImmigrationScenarioRecord[] = [
  { scenarioId: "complete-evidence", label: "Complete evidence file", expectedStatus: "PRECHECK_COMPLETE", input: immigrationInput("complete", {}) },
  { scenarioId: "missing-authorization", label: "Missing authorization evidence", expectedStatus: "ACTION_REQUIRED", input: immigrationInput("missing-auth", { workAuthorizationReference: "", workAuthorizationStartDate: "", workAuthorizationEndDate: "" }) },
  { scenarioId: "expired-authorization", label: "Expired authorization", expectedStatus: "BLOCKED", input: immigrationInput("expired-auth", { workAuthorizationEndDate: "2026-09-15" }) },
  { scenarioId: "late-authorization-start", label: "Authorization starts after assignment", expectedStatus: "BLOCKED", input: immigrationInput("late-start", { workAuthorizationStartDate: "2026-10-02" }) },
  { scenarioId: "authorization-end-gap", label: "Authorization ends before assignment", expectedStatus: "ACTION_REQUIRED", input: immigrationInput("end-gap", { workAuthorizationEndDate: "2028-01-31" }) },
  { scenarioId: "passport-end-gap", label: "Passport expires before assignment", expectedStatus: "ACTION_REQUIRED", input: immigrationInput("passport-gap", { passportExpiryDate: "2028-06-30" }) },
  { scenarioId: "future-review", label: "Future-dated specialist review", expectedStatus: "ACTION_REQUIRED", input: immigrationInput("future-review", { reviewedAt: "2026-09-17T09:00" }) },
  { scenarioId: "invalid-assignment", label: "Invalid assignment window", expectedStatus: "BLOCKED", input: immigrationInput("invalid-window", { assignmentStartDate: "2028-10-01", assignmentEndDate: "2028-09-30" }) },
];

export function runImmigrationScenarioPack(): ImmigrationScenarioRun {
  const rows = IMMIGRATION_SCENARIOS.map((scenario) => {
    const assessment = assessImmigrationSupport(scenario.input, new Date("2026-09-16T12:00:00.000Z"));
    return {
      ...scenario,
      actualStatus: assessment.status,
      matchedExpected: assessment.status === scenario.expectedStatus,
      passedGates: assessment.automationSummary.passedGateCount,
      totalGates: assessment.automationSummary.totalGateCount,
      openActions: assessment.automationSummary.openActionCount,
      criticalAlerts: assessment.automationSummary.criticalAlertCount,
      nextAction: assessment.automationSummary.nextAction,
    };
  });
  const actual = {
    caseCount: rows.length,
    completeCount: rows.filter((row) => row.actualStatus === "PRECHECK_COMPLETE").length,
    actionRequiredCount: rows.filter((row) => row.actualStatus === "ACTION_REQUIRED").length,
    blockedCount: rows.filter((row) => row.actualStatus === "BLOCKED").length,
  };
  const expected = { caseCount: 8, completeCount: 1, actionRequiredCount: 4, blockedCount: 3 };
  const checks: ScenarioCheck[] = [
    ...Object.entries(expected).map(([key, value]) => ({ label: key, expected: value, actual: actual[key as keyof typeof actual], passed: value === actual[key as keyof typeof actual] })),
    { label: "caseStatusMatches", expected: rows.length, actual: rows.filter((row) => row.matchedExpected).length, passed: rows.every((row) => row.matchedExpected) },
  ];
  return {
    id: "immigration-controls-8",
    kind: "immigration",
    label: "Immigration evidence and expiry controls",
    description: "Eight India to United States cases covering complete, missing, expired, date-gap and invalid assignment evidence.",
    expected,
    actual,
    checks,
    allChecksPassed: checks.every((check) => check.passed),
    rows,
  };
}

export const SCENARIO_CATALOG = [
  ...((Object.keys(payrollLabels) as PayrollScenarioId[]).map((id) => ({ id, kind: "payroll" as const, ...payrollLabels[id], population: getPayrollScenarioInputs(id).length }))),
  { id: "immigration-controls-8" as const, kind: "immigration" as const, label: "Immigration evidence and expiry controls", description: "Eight India to United States cases covering complete, missing, expired, date-gap and invalid assignment evidence.", population: 8 },
];

export function runScenario(id: ScenarioId): ScenarioRun {
  return id === "immigration-controls-8" ? runImmigrationScenarioPack() : runPayrollScenario(id);
}

export const SCENARIO_DATASETS = [
  { id: "employee-master", label: "100 employee master", description: "Employment, organization, location, tax, PF and masked payment details." },
  { id: "baseline-inputs", label: "Baseline payroll inputs", description: "Exact 100 employee inputs used by the September baseline run." },
  { id: "baseline-expected", label: "Baseline expected results", description: "Employee-level deterministic outputs and review-required rows." },
  { id: "payroll-scenario-inputs", label: "Payroll scenario inputs", description: "Variable pay, joiner, boundary, TDS and fail-closed test records." },
  { id: "payroll-scenario-expected", label: "Payroll scenario expected results", description: "Expected employee and scenario totals for reconciliation." },
  { id: "immigration-inputs", label: "Immigration case inputs", description: "Eight evidence and expiry case files." },
  { id: "immigration-expected", label: "Immigration expected results", description: "Expected status, actions and alerts for each immigration case." },
  { id: "test-script", label: "UAT test script", description: "What to run, what to change and what outcome to verify." },
] as const;

export function getScenarioDataset(id: string): Array<Record<string, string | number | boolean | null>> {
  const payrollIds = (Object.keys(payrollLabels) as PayrollScenarioId[]);
  const payrollRuns = payrollIds.map(runPayrollScenario);
  const immigrationRun = runImmigrationScenarioPack();
  if (id === "employee-master") return buildEmployeeMaster();
  if (id === "baseline-inputs") return getPayrollScenarioInputs("monthly-baseline-100");
  if (id === "baseline-expected") return runPayrollScenario("monthly-baseline-100").rows.map((row) => ({ ...row, assumptions: row.assumptions.join(" | ") }));
  if (id === "payroll-scenario-inputs") return payrollIds.filter((scenarioId) => scenarioId !== "monthly-baseline-100").flatMap(getPayrollScenarioInputs);
  if (id === "payroll-scenario-expected") return payrollRuns.filter((run) => run.id !== "monthly-baseline-100").flatMap((run) => run.rows.map((row) => ({ ...row, assumptions: row.assumptions.join(" | ") })));
  if (id === "immigration-inputs") return IMMIGRATION_SCENARIOS.map((row) => ({ scenarioId: row.scenarioId, label: row.label, expectedStatus: row.expectedStatus, ...row.input }));
  if (id === "immigration-expected") return immigrationRun.rows.map(({ input: _input, ...row }) => row);
  if (id === "test-script") return SCENARIO_CATALOG.map((scenario, index) => ({
    testNumber: index + 1,
    scenarioId: scenario.id,
    scenario: scenario.label,
    population: scenario.population,
    action: "Open Scenario Lab, select this scenario, and choose Run scenario",
    expected: scenario.kind === "payroll" ? "Every reconciliation check passes and employee results match the expected data sheet" : "All eight case statuses match the expected data sheet and payroll activation remains blocked",
  }));
  throw new Error("Unknown scenario dataset");
}

export function buildScenarioWorkbookData() {
  return {
    generatedFor: `${UAT_COMPANY.name} real-use UAT`,
    scenarioCatalog: SCENARIO_CATALOG,
    employeeMaster: getScenarioDataset("employee-master"),
    baselineInputs: getScenarioDataset("baseline-inputs"),
    baselineExpected: getScenarioDataset("baseline-expected"),
    payrollScenarioInputs: getScenarioDataset("payroll-scenario-inputs"),
    payrollScenarioExpected: getScenarioDataset("payroll-scenario-expected"),
    immigrationInputs: getScenarioDataset("immigration-inputs"),
    immigrationExpected: getScenarioDataset("immigration-expected"),
    testScript: getScenarioDataset("test-script"),
  };
}
