import { UAT_COMPANY } from "./uat-niva-data";

export type CopilotIssue = {
  employee: string;
  employeeId: string;
  issue: string;
  severity: "High" | "Blocker" | "Medium";
};

export type PayrollCopilotContext = {
  employeeCount: number;
  openIssues: CopilotIssue[];
  payrollStatus: string;
};

const cash = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function includesAny(query: string, terms: string[]) {
  return terms.some((term) => query.includes(term));
}

export function answerPayrollCopilot(input: string, context: PayrollCopilotContext) {
  const query = input.trim().toLowerCase();
  const blockers = context.openIssues.filter((issue) => issue.severity === "Blocker");

  if (!query) {
    return "Enter a question about the September payroll, its review items, statutory controls, or the India to United States mobility case.";
  }

  if (includesAny(query, ["mobility", "united states", "usa", "aditi", "host state", "spt", "substantial presence"])) {
    return "Aditi Joshi's India to United States case is blocked. The U.S. host state and U.S. monetary tax engine are blocking activation, while four evidence or specialist reviews remain. The day ledger has one pending evidence item.";
  }

  if (includesAny(query, ["blocking", "blocker", "why can't", "why cant", "submit", "approval"])) {
    if (!blockers.length) {
      return context.openIssues.length
        ? `No blocking issue remains. ${context.openIssues.length} non-blocking review item${context.openIssues.length === 1 ? "" : "s"} must still be checked before approval.`
        : `No exception remains. The September payroll is ${context.payrollStatus.toLowerCase()} and can move through its next controlled step.`;
    }

    return blockers
      .map((issue) => `${issue.employeeId}, ${issue.employee}, is blocking approval because ${issue.issue.toLowerCase()}.`)
      .join(" ");
  }

  if (includesAny(query, ["review", "exception", "who needs", "attention"])) {
    if (!context.openIssues.length) {
      return "No payroll review item remains in this browser UAT session.";
    }

    const details = context.openIssues
      .map((issue) => `${issue.employeeId} ${issue.employee}: ${issue.issue}`)
      .join("; ");
    return `${context.openIssues.length} review item${context.openIssues.length === 1 ? " remains" : "s remain"}: ${details}.`;
  }

  if (includesAny(query, ["tds", "provident fund", " pf", "professional tax", " pt", "deduction", "statutory", "calculate", "calculation"])) {
    return "TDS, employee PF, Karnataka Professional Tax, total deductions and net salary are calculated only by the deterministic payroll service. Open the 100 employee payroll run to inspect the server-returned result and calculation lineage for each employee.";
  }

  if (includesAny(query, ["summary", "september", "employee", "headcount", "gross", "net pay", "employer cost", "payroll status", "status"])) {
    return `${UAT_COMPANY.name} has ${context.employeeCount} employees in this synthetic September 2026 UAT session. Representative gross payroll is ${cash.format(UAT_COMPANY.grossPayroll)}, ${context.openIssues.length} item${context.openIssues.length === 1 ? " needs" : "s need"} review, and the payroll status is ${context.payrollStatus}.`;
  }

  if (includesAny(query, ["help", "what can", "topics"])) {
    return "I can explain payroll review items, approval blockers, the September payroll summary, deterministic TDS, PF and Karnataka PT controls, and Aditi Joshi's India to United States mobility readiness.";
  }

  return "I cannot answer that reliably in zero-cost deterministic mode. Ask about review items, approval blockers, the September payroll summary, statutory calculations, or Aditi Joshi's mobility case.";
}
