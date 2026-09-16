import { calculateSupportedUatPayroll, type UatPayrollCalculationInput } from "./uat-payroll-calculator";

export type PayrollComponentCategory = "Fixed earning" | "Variable earning" | "Reimbursement" | "Employer contribution" | "Statutory deduction" | "Recovery" | "Perquisite" | "Settlement";
export type PayrollComponent = {
  code: string;
  name: string;
  payslipName: string;
  category: PayrollComponentCategory;
  payType: "Fixed" | "Variable" | "One time" | "Calculated";
  calculation: string;
  ctc: boolean;
  gross: boolean;
  cash: boolean;
  taxable: "Yes" | "No" | "Conditional";
  pfTreatment: "Included" | "Excluded" | "Statutory evaluation";
  esiTreatment: "Included" | "Excluded" | "Statutory evaluation";
  prorated: boolean;
  active: boolean;
  engineStatus: "Calculated" | "Input" | "Reference only";
};

const c = (component: PayrollComponent) => component;

export const INDIA_PAYROLL_COMPONENTS: PayrollComponent[] = [
  c({code:"BASIC",name:"Basic Pay",payslipName:"Basic",category:"Fixed earning",payType:"Fixed",calculation:"Employee monthly amount",ctc:true,gross:true,cash:true,taxable:"Yes",pfTreatment:"Included",esiTreatment:"Included",prorated:true,active:true,engineStatus:"Calculated"}),
  c({code:"HRA",name:"House Rent Allowance",payslipName:"HRA",category:"Fixed earning",payType:"Fixed",calculation:"Template percentage of Basic",ctc:true,gross:true,cash:true,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Included",prorated:true,active:true,engineStatus:"Calculated"}),
  c({code:"SPL_ALLOW",name:"Special Allowance",payslipName:"Special Allowance",category:"Fixed earning",payType:"Fixed",calculation:"CTC balancing amount",ctc:true,gross:true,cash:true,taxable:"Yes",pfTreatment:"Statutory evaluation",esiTreatment:"Included",prorated:true,active:true,engineStatus:"Calculated"}),
  c({code:"DA",name:"Dearness Allowance",payslipName:"Dearness Allowance",category:"Fixed earning",payType:"Fixed",calculation:"Employee monthly amount",ctc:true,gross:true,cash:true,taxable:"Yes",pfTreatment:"Included",esiTreatment:"Included",prorated:true,active:false,engineStatus:"Reference only"}),
  c({code:"SHIFT_ALLOW",name:"Shift Allowance",payslipName:"Shift Allowance",category:"Variable earning",payType:"Variable",calculation:"Approved shifts multiplied by rate",ctc:false,gross:true,cash:true,taxable:"Yes",pfTreatment:"Statutory evaluation",esiTreatment:"Included",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"PERF_BONUS",name:"Performance Bonus",payslipName:"Performance Bonus",category:"Variable earning",payType:"Variable",calculation:"Approved amount for pay period",ctc:true,gross:true,cash:true,taxable:"Yes",pfTreatment:"Excluded",esiTreatment:"Statutory evaluation",prorated:false,active:true,engineStatus:"Calculated"}),
  c({code:"SALES_COMM",name:"Sales Commission",payslipName:"Sales Commission",category:"Variable earning",payType:"Variable",calculation:"Approved amount for pay period",ctc:true,gross:true,cash:true,taxable:"Yes",pfTreatment:"Excluded",esiTreatment:"Statutory evaluation",prorated:false,active:true,engineStatus:"Calculated"}),
  c({code:"JOIN_BONUS",name:"Joining Bonus",payslipName:"Joining Bonus",category:"Variable earning",payType:"One time",calculation:"Scheduled approved amount",ctc:true,gross:true,cash:true,taxable:"Yes",pfTreatment:"Excluded",esiTreatment:"Statutory evaluation",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"RETENTION_BONUS",name:"Retention Bonus",payslipName:"Retention Bonus",category:"Variable earning",payType:"One time",calculation:"Scheduled approved amount",ctc:true,gross:true,cash:true,taxable:"Yes",pfTreatment:"Excluded",esiTreatment:"Statutory evaluation",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"OVERTIME",name:"Overtime Pay",payslipName:"Overtime",category:"Variable earning",payType:"Variable",calculation:"Approved hours multiplied by rate",ctc:false,gross:true,cash:true,taxable:"Yes",pfTreatment:"Statutory evaluation",esiTreatment:"Included",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"PHONE_REIMB",name:"Telephone and Internet Reimbursement",payslipName:"Telephone Reimbursement",category:"Reimbursement",payType:"Variable",calculation:"Approved claim up to policy limit",ctc:true,gross:false,cash:true,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Input"}),
  c({code:"TRAVEL_REIMB",name:"Business Travel Reimbursement",payslipName:"Travel Reimbursement",category:"Reimbursement",payType:"Variable",calculation:"Approved business expense claim",ctc:false,gross:false,cash:true,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Input"}),
  c({code:"MEAL_REIMB",name:"Meal Reimbursement",payslipName:"Meal Reimbursement",category:"Reimbursement",payType:"Variable",calculation:"Approved claim up to policy limit",ctc:true,gross:false,cash:true,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"ER_PF",name:"Employer Provident Fund",payslipName:"Employer PF",category:"Employer contribution",payType:"Calculated",calculation:"Deterministic PF engine",ctc:true,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"GRATUITY",name:"Gratuity Provision",payslipName:"Gratuity",category:"Employer contribution",payType:"Calculated",calculation:"Company policy and statutory eligibility",ctc:true,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"ER_NPS",name:"Employer NPS Contribution",payslipName:"Employer NPS",category:"Employer contribution",payType:"Calculated",calculation:"Eligible salary multiplied by configured rate",ctc:true,gross:false,cash:false,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"MED_INS",name:"Medical Insurance Premium",payslipName:"Medical Insurance",category:"Employer contribution",payType:"Fixed",calculation:"Employer policy cost",ctc:true,gross:false,cash:false,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"EE_PF",name:"Employee Provident Fund",payslipName:"Provident Fund",category:"Statutory deduction",payType:"Calculated",calculation:"Deterministic PF engine",ctc:false,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Calculated"}),
  c({code:"VPF",name:"Voluntary Provident Fund",payslipName:"Voluntary PF",category:"Statutory deduction",payType:"Calculated",calculation:"Employee election multiplied by eligible wages",ctc:false,gross:false,cash:false,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"ESI",name:"Employee State Insurance",payslipName:"ESI",category:"Statutory deduction",payType:"Calculated",calculation:"Deterministic ESI engine when enabled",ctc:false,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"PT",name:"Professional Tax",payslipName:"Professional Tax",category:"Statutory deduction",payType:"Calculated",calculation:"State and period rule",ctc:false,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Calculated"}),
  c({code:"TDS",name:"Tax Deducted at Source",payslipName:"Income Tax",category:"Statutory deduction",payType:"Calculated",calculation:"Deterministic salary tax engine",ctc:false,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Calculated"}),
  c({code:"LWF",name:"Labour Welfare Fund",payslipName:"Labour Welfare Fund",category:"Statutory deduction",payType:"Calculated",calculation:"State and period rule when enabled",ctc:false,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"EE_NPS",name:"Employee NPS Contribution",payslipName:"Employee NPS",category:"Statutory deduction",payType:"Calculated",calculation:"Employee election multiplied by eligible salary",ctc:false,gross:false,cash:false,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"LOAN_EMI",name:"Employee Loan EMI",payslipName:"Loan Recovery",category:"Recovery",payType:"Fixed",calculation:"Loan schedule instalment",ctc:false,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Input"}),
  c({code:"SAL_ADV_REC",name:"Salary Advance Recovery",payslipName:"Salary Advance Recovery",category:"Recovery",payType:"One time",calculation:"Approved recovery amount",ctc:false,gross:false,cash:false,taxable:"No",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Input"}),
  c({code:"NOTICE_REC",name:"Notice Pay Recovery",payslipName:"Notice Pay Recovery",category:"Recovery",payType:"One time",calculation:"Approved final settlement recovery",ctc:false,gross:false,cash:false,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"RSU_PERQ",name:"RSU or ESOP Taxable Perquisite",payslipName:"Equity Perquisite",category:"Perquisite",payType:"One time",calculation:"Approved taxable perquisite value",ctc:false,gross:false,cash:false,taxable:"Yes",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"CAR_PERQ",name:"Company Car Perquisite",payslipName:"Car Perquisite",category:"Perquisite",payType:"Calculated",calculation:"Approved valuation rule",ctc:true,gross:false,cash:false,taxable:"Yes",pfTreatment:"Excluded",esiTreatment:"Excluded",prorated:false,active:false,engineStatus:"Reference only"}),
  c({code:"ARREARS",name:"Salary Arrears",payslipName:"Salary Arrears",category:"Settlement",payType:"One time",calculation:"Prior period recalculation difference",ctc:false,gross:true,cash:true,taxable:"Yes",pfTreatment:"Statutory evaluation",esiTreatment:"Statutory evaluation",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"EARNING_CORR",name:"Earning Correction",payslipName:"Earning Correction",category:"Settlement",payType:"One time",calculation:"Controlled correction linked to original earning",ctc:false,gross:true,cash:true,taxable:"Conditional",pfTreatment:"Statutory evaluation",esiTreatment:"Statutory evaluation",prorated:false,active:true,engineStatus:"Reference only"}),
  c({code:"LEAVE_ENCASH",name:"Leave Encashment",payslipName:"Leave Encashment",category:"Settlement",payType:"One time",calculation:"Eligible days multiplied by policy rate",ctc:false,gross:true,cash:true,taxable:"Conditional",pfTreatment:"Excluded",esiTreatment:"Statutory evaluation",prorated:false,active:true,engineStatus:"Reference only"}),
];

export const NIVA_GLOBAL_TECH_TEMPLATE = {
  id: "niva-global-tech-india-v1",
  name: "Global Technology India",
  effectiveFrom: "2026-04-01",
  currency: "INR",
  componentCodes: ["BASIC","HRA","SPL_ALLOW","PERF_BONUS","SALES_COMM","JOIN_BONUS","PHONE_REIMB","TRAVEL_REIMB","ER_PF","GRATUITY","ER_NPS","EE_PF","PT","TDS","EE_NPS","LOAN_EMI","SAL_ADV_REC","ARREARS","EARNING_CORR","LEAVE_ENCASH","RSU_PERQ"],
};

export type ComponentCalculationRequest = {
  employeeId: string; employeeName: string; values: Record<string, number>; taxableSalaryYtd: number; tdsDeductedYtd: number; pfWages: number;
};

export function calculateFromComponents(request: ComponentCalculationRequest) {
  const value = (code: string) => request.values[code] ?? 0;
  const input: UatPayrollCalculationInput = {
    employeeId: request.employeeId,
    employeeName: request.employeeName,
    workState: "Karnataka",
    taxYear: "2026-27",
    payrollMonth: 9,
    taxRegime: "new",
    basicSalary: value("BASIC"),
    hra: value("HRA"),
    specialAllowance: value("SPL_ALLOW"),
    bonus: value("PERF_BONUS"),
    commission: value("SALES_COMM"),
    otherTaxableEarnings: 0,
    taxableSalaryYtd: request.taxableSalaryYtd,
    tdsDeductedYtd: request.tdsDeductedYtd,
    pfApplicable: true,
    pfWages: request.pfWages,
  };
  const result = calculateSupportedUatPayroll(input);
  return {
    templateId: NIVA_GLOBAL_TECH_TEMPLATE.id,
    inputComponents: Object.entries(request.values).filter(([,amount]) => amount !== 0).map(([code,amount]) => ({code,amount})),
    calculatedComponents: result.status === "CALCULATED" ? [
      {code:"TDS",amount:result.tds},
      {code:"EE_PF",amount:result.employeePf},
      {code:"PT",amount:result.professionalTax},
    ] : [],
    result,
  };
}
