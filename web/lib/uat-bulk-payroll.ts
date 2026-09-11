import { UAT_COMPANY, UAT_EMPLOYEES } from "./uat-niva-data";
import { calculateSupportedUatPayroll, type UatPayrollCalculationResult } from "./uat-payroll-calculator";

export type UatBulkPayrollRow = UatPayrollCalculationResult & {
  role: string;
  sourceStatus: "Needs review" | "Blocked" | "Ready";
};

export type UatBulkPayrollRun = {
  company: typeof UAT_COMPANY;
  scope: "founder-uat-karnataka-profile";
  status: "CALCULATED_WITH_REVIEWS" | "CALCULATED";
  employeeCount: number;
  calculatedCount: number;
  reviewCount: number;
  grossPayroll: number;
  totalTds: number;
  totalEmployeePf: number;
  totalProfessionalTax: number;
  totalDeductions: number;
  netPayable: number;
  rows: UatBulkPayrollRow[];
  assumptions: string[];
};

function syntheticSupportedInput(employee: (typeof UAT_EMPLOYEES)[number]) {
  const basicSalary = Math.round(employee.gross * 0.45);
  const hra = Math.round(basicSalary * 0.5);
  const specialAllowance = employee.gross - basicSalary - hra;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    workState: "Karnataka" as const,
    taxYear: "2026-27" as const,
    payrollMonth: 9 as const,
    taxRegime: "new" as const,
    basicSalary,
    hra,
    specialAllowance,
    bonus: 0,
    commission: 0,
    otherTaxableEarnings: 0,
    taxableSalaryYtd: employee.gross * 5,
    tdsDeductedYtd: 0,
    pfApplicable: true as const,
    pfWages: Math.min(basicSalary, 15_000),
  };
}

function sourceReview(employee: (typeof UAT_EMPLOYEES)[number]): UatPayrollCalculationResult {
  return {
    status: "REVIEW_REQUIRED",
    employeeId: employee.id,
    employeeName: employee.name,
    scope: "uat-verified-subset",
    grossSalary: employee.gross,
    projectedSalary: null,
    taxableIncome: null,
    annualTaxLiability: null,
    tds: null,
    employeePf: null,
    professionalTax: null,
    totalDeductions: null,
    netSalary: null,
    reviewReason: employee.status === "Blocked"
      ? "Employee master contains a blocking payroll exception that must be resolved before calculation."
      : "Employee master requires payroll-input review before calculation.",
    assumptions: [],
  };
}

export function runNivaBulkPayrollUat(): UatBulkPayrollRun {
  const rows: UatBulkPayrollRow[] = UAT_EMPLOYEES.map((employee) => {
    const result = employee.status === "Ready"
      ? calculateSupportedUatPayroll(syntheticSupportedInput(employee))
      : sourceReview(employee);

    return {
      ...result,
      role: employee.role,
      sourceStatus: employee.status,
    };
  });

  const calculated = rows.filter((row) => row.status === "CALCULATED");
  const reviewCount = rows.length - calculated.length;
  const sum = (selector: (row: UatBulkPayrollRow) => number | null) =>
    calculated.reduce((total, row) => total + (selector(row) ?? 0), 0);

  return {
    company: UAT_COMPANY,
    scope: "founder-uat-karnataka-profile",
    status: reviewCount ? "CALCULATED_WITH_REVIEWS" : "CALCULATED",
    employeeCount: rows.length,
    calculatedCount: calculated.length,
    reviewCount,
    grossPayroll: sum((row) => row.grossSalary),
    totalTds: sum((row) => row.tds),
    totalEmployeePf: sum((row) => row.employeePf),
    totalProfessionalTax: sum((row) => row.professionalTax),
    totalDeductions: sum((row) => row.totalDeductions),
    netPayable: sum((row) => row.netSalary),
    rows,
    assumptions: [
      "Synthetic founder UAT calculation profile only, not a production payroll master.",
      "Employees marked Ready are calculated using Karnataka, new regime, September 2026 and standard PF assumptions.",
      "Current gross is split for UAT as 45% basic, HRA at 50% of basic, and the balance as special allowance.",
      "YTD taxable salary is represented as five prior months at the current monthly gross and YTD TDS is zero.",
      "Employees already marked Needs review or Blocked remain REVIEW_REQUIRED and are excluded from aggregate net payable.",
      "Production rollout must use each employee's actual work state, declarations, YTD values, PF membership and verified statutory inputs.",
    ],
  };
}
