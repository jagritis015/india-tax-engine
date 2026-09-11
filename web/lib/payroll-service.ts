import { UAT_COMPANY } from "./uat-niva-data";

export type PayrollRunStatus = "draft" | "validation" | "approval" | "finalized";

export type PayrollException = {
  id: string;
  employeeId: string;
  employeeName: string;
  code: string;
  severity: "medium" | "high" | "blocker";
  summary: string;
  resolved: boolean;
};

export type PayrollWorkspaceSnapshot = {
  company: {
    id: string;
    name: string;
  };
  payrollRun: {
    id: string;
    period: string;
    taxYear: string;
    status: PayrollRunStatus;
    employeeCount: number;
    grossPayroll: number;
    netPayable: number;
    employerCost: number;
  };
  exceptions: PayrollException[];
  source: "representative-uat" | "payroll-engine";
  statutoryArithmetic: "server-deterministic-only";
};

export interface PayrollApplicationService {
  getWorkspaceSnapshot(companyId: string, period: string): Promise<PayrollWorkspaceSnapshot>;
}

/**
 * Founder-UAT adapter.
 *
 * It deliberately returns representative data and performs no statutory
 * monetary calculation. Production will replace this adapter with a server
 * integration to the Python deterministic payroll/statutory engine while the
 * UI and API contract remain stable.
 */
export class RepresentativeUatPayrollService implements PayrollApplicationService {
  async getWorkspaceSnapshot(companyId: string, period: string): Promise<PayrollWorkspaceSnapshot> {
    return {
      company: { id: companyId || UAT_COMPANY.id, name: UAT_COMPANY.name },
      payrollRun: {
        id: `run-${period}`,
        period,
        taxYear: "2026-27",
        status: "validation",
        employeeCount: UAT_COMPANY.employeeCount,
        grossPayroll: UAT_COMPANY.grossPayroll,
        netPayable: UAT_COMPANY.netPayable,
        employerCost: UAT_COMPANY.employerCost,
      },
      exceptions: [
        {
          id: "ex-001",
          employeeId: "NVL-017",
          employeeName: "Aditi Joshi",
          code: "PAYROLL_INPUT_REVIEW",
          severity: "high",
          summary: "Payroll input requires review before approval",
          resolved: false,
        },
        {
          id: "ex-002",
          employeeId: "NVL-042",
          employeeName: "Pooja Sharma",
          code: "PT_LOCATION_REVIEW",
          severity: "blocker",
          summary: "Professional Tax location/rule selection requires review",
          resolved: false,
        },
        {
          id: "ex-003",
          employeeId: "NVL-063",
          employeeName: "Kiran Verma",
          code: "PAYROLL_INPUT_REVIEW",
          severity: "medium",
          summary: "Payroll input requires review before approval",
          resolved: false,
        },
      ],
      source: "representative-uat",
      statutoryArithmetic: "server-deterministic-only",
    };
  }
}

export function getPayrollApplicationService(): PayrollApplicationService {
  return new RepresentativeUatPayrollService();
}
