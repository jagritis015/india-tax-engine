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
      company: { id: companyId, name: "Acme Labs" },
      payrollRun: {
        id: `run-${period}`,
        period,
        taxYear: "2026-27",
        status: "validation",
        employeeCount: 84,
        grossPayroll: 6842500,
        netPayable: 5526140,
        employerCost: 7218940,
      },
      exceptions: [
        {
          id: "ex-001",
          employeeId: "ACM-001",
          employeeName: "Aarav Mehta",
          code: "NET_PAY_VARIANCE",
          severity: "high",
          summary: "Net pay changed by 31%",
          resolved: false,
        },
        {
          id: "ex-002",
          employeeId: "ACM-002",
          employeeName: "Meera Nair",
          code: "PT_LOCATION_MISSING",
          severity: "blocker",
          summary: "Professional Tax location missing",
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
