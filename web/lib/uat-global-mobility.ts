export type ObligationStatus = "OPEN" | "RESOLVED" | "CANCELLED";
export type ObligationWorkstream =
  "IMMIGRATION" | "DAYS" | "TAX" | "SOCIAL_SECURITY";
export type ReadinessStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type ObligationRecord = {
  obligationId: string;
  caseId: string;
  sourceType: "MOBILITY_CASE";
  sourceId: string;
  workstream: ObligationWorkstream;
  obligationType: string;
  jurisdiction: string;
  dueDate: string | null;
  status: ObligationStatus;
  severityWhenOpen: "BLOCKER" | "REVIEW";
  reason: string;
  evidenceReferences: string[];
  ruleReference: string;
  provenanceReference: string;
  revision: number;
  updatedAt: string;
};

export type ReadinessBlocker = {
  workstream: string;
  severity: "BLOCKER" | "REVIEW";
  reason: string;
};
export type ReadinessEvaluation = {
  caseId: string;
  evaluationVersion: number;
  computedStatus: ReadinessStatus;
  blockers: ReadinessBlocker[];
  evaluatedAt: string;
  sourceObligationRevisions: Record<string, number>;
};

export type MobilityCase = {
  caseId: string;
  employeeId: string;
  employeeName: string;
  homeCountry: string;
  hostCountry: string;
  assignmentType:
    | "Short-term"
    | "Long-term"
    | "Permanent transfer"
    | "Business traveler"
    | "Commuter";
  lifecycleStatus: "Pre-assignment" | "Mobilizing" | "Active" | "Repatriating";
  startDate: string;
  endDate: string | null;
  owner: string;
  payrollModel: "Standard" | "Split" | "Shadow";
  workAuthorizationExpiry: string | null;
  totalizationAgreement: boolean;
  dtaaExists: boolean;
  defaultDayThreshold: number;
  currentHostDays: number;
  compensationHomePct: number;
  compensationHostPct: number;
  unsupportedCalculations: string[];
  lastUpdated: string;
};

const updatedAt = "2026-09-17T09:00:00+05:30";
export const MOBILITY_CASE_FIXTURES: MobilityCase[] = [
  {
    caseId: "MOB-NVL-017-IND-US",
    employeeId: "NVL-017",
    employeeName: "Aditi Joshi",
    homeCountry: "India",
    hostCountry: "United States",
    assignmentType: "Long-term",
    lifecycleStatus: "Active",
    startDate: "2026-01-12",
    endDate: "2028-01-11",
    owner: "Meera Shah",
    payrollModel: "Shadow",
    workAuthorizationExpiry: "2027-01-10",
    totalizationAgreement: false,
    dtaaExists: true,
    defaultDayThreshold: 183,
    currentHostDays: 121,
    compensationHomePct: 70,
    compensationHostPct: 30,
    unsupportedCalculations: [
      "Verified U.S. federal, state and local monetary tax engine is not available.",
    ],
    lastUpdated: updatedAt,
  },
  {
    caseId: "MOB-NVL-028-IND-DE",
    employeeId: "NVL-028",
    employeeName: "Rohan Kapoor",
    homeCountry: "India",
    hostCountry: "Germany",
    assignmentType: "Long-term",
    lifecycleStatus: "Mobilizing",
    startDate: "2026-11-01",
    endDate: "2028-10-31",
    owner: "Kavya Menon",
    payrollModel: "Split",
    workAuthorizationExpiry: "2028-10-31",
    totalizationAgreement: true,
    dtaaExists: true,
    defaultDayThreshold: 183,
    currentHostDays: 0,
    compensationHomePct: 60,
    compensationHostPct: 40,
    unsupportedCalculations: [],
    lastUpdated: updatedAt,
  },
  {
    caseId: "MOB-NVL-044-IND-BM",
    employeeId: "NVL-044",
    employeeName: "Neha Iyer",
    homeCountry: "India",
    hostCountry: "Bermuda",
    assignmentType: "Short-term",
    lifecycleStatus: "Pre-assignment",
    startDate: "2026-10-15",
    endDate: "2027-04-14",
    owner: "Meera Shah",
    payrollModel: "Shadow",
    workAuthorizationExpiry: null,
    totalizationAgreement: false,
    dtaaExists: false,
    defaultDayThreshold: 183,
    currentHostDays: 0,
    compensationHomePct: 100,
    compensationHostPct: 0,
    unsupportedCalculations: [],
    lastUpdated: updatedAt,
  },
  {
    caseId: "MOB-NVL-063-IND-SG",
    employeeId: "NVL-063",
    employeeName: "Kiran Verma",
    homeCountry: "India",
    hostCountry: "Singapore",
    assignmentType: "Business traveler",
    lifecycleStatus: "Active",
    startDate: "2026-07-01",
    endDate: "2026-12-20",
    owner: "Arjun Rao",
    payrollModel: "Standard",
    workAuthorizationExpiry: "2026-12-20",
    totalizationAgreement: false,
    dtaaExists: true,
    defaultDayThreshold: 183,
    currentHostDays: 48,
    compensationHomePct: 100,
    compensationHostPct: 0,
    unsupportedCalculations: [],
    lastUpdated: updatedAt,
  },
  {
    caseId: "MOB-NVL-081-IND-GB",
    employeeId: "NVL-081",
    employeeName: "Ananya Rao",
    homeCountry: "India",
    hostCountry: "United Kingdom",
    assignmentType: "Permanent transfer",
    lifecycleStatus: "Active",
    startDate: "2026-04-01",
    endDate: null,
    owner: "Kavya Menon",
    payrollModel: "Split",
    workAuthorizationExpiry: "2029-03-31",
    totalizationAgreement: true,
    dtaaExists: true,
    defaultDayThreshold: 183,
    currentHostDays: 169,
    compensationHomePct: 0,
    compensationHostPct: 100,
    unsupportedCalculations: [],
    lastUpdated: updatedAt,
  },
];

export const OBLIGATION_FIXTURES: ObligationRecord[] = [
  {
    obligationId: "OBL-US-IMM-01",
    caseId: "MOB-NVL-017-IND-US",
    sourceType: "MOBILITY_CASE",
    sourceId: "MOB-NVL-017-IND-US",
    workstream: "IMMIGRATION",
    obligationType: "Work authorization verification",
    jurisdiction: "United States",
    dueDate: "2026-09-30",
    status: "OPEN",
    severityWhenOpen: "BLOCKER",
    reason:
      "Work authorization evidence requires specialist verification before payroll activation.",
    evidenceReferences: ["I-797-UAT-017"],
    ruleReference: "US-WA-UAT-1",
    provenanceReference: "Immigration case file",
    revision: 2,
    updatedAt,
  },
  {
    obligationId: "OBL-US-DAYS-01",
    caseId: "MOB-NVL-017-IND-US",
    sourceType: "MOBILITY_CASE",
    sourceId: "MOB-NVL-017-IND-US",
    workstream: "DAYS",
    obligationType: "Corroborate travel day",
    jurisdiction: "United States",
    dueDate: "2026-09-20",
    status: "OPEN",
    severityWhenOpen: "REVIEW",
    reason:
      "One United States physical-presence day lacks corroborating travel evidence.",
    evidenceReferences: ["DAY-UAT-2026-01-14"],
    ruleReference: "US-SPT-EVIDENCE-V1",
    provenanceReference: "Mobility day ledger",
    revision: 1,
    updatedAt,
  },
  {
    obligationId: "OBL-DE-COC-01",
    caseId: "MOB-NVL-028-IND-DE",
    sourceType: "MOBILITY_CASE",
    sourceId: "MOB-NVL-028-IND-DE",
    workstream: "SOCIAL_SECURITY",
    obligationType: "Certificate of coverage",
    jurisdiction: "India / Germany",
    dueDate: "2026-10-15",
    status: "OPEN",
    severityWhenOpen: "REVIEW",
    reason:
      "Certificate of coverage is required to exercise the India–Germany totalization branch.",
    evidenceReferences: [],
    ruleReference: "IN-DE-SSA-UAT",
    provenanceReference: "Corridor totalization configuration",
    revision: 1,
    updatedAt,
  },
  {
    obligationId: "OBL-DE-TAX-01",
    caseId: "MOB-NVL-028-IND-DE",
    sourceType: "MOBILITY_CASE",
    sourceId: "MOB-NVL-028-IND-DE",
    workstream: "TAX",
    obligationType: "Tax equalization settlement",
    jurisdiction: "India / Germany",
    dueDate: "2026-09-15",
    status: "RESOLVED",
    severityWhenOpen: "BLOCKER",
    reason: "Tax equalization settlement completed for tax year 2026-27.",
    evidenceReferences: ["TEQ-NVL-028-2026-27"],
    ruleReference: "IN-DE-DTAA-UAT-V1",
    provenanceReference: "Tax equalization UAT session record",
    revision: 2,
    updatedAt,
  },
  {
    obligationId: "OBL-BM-TAX-01",
    caseId: "MOB-NVL-044-IND-BM",
    sourceType: "MOBILITY_CASE",
    sourceId: "MOB-NVL-044-IND-BM",
    workstream: "TAX",
    obligationType: "Double-taxation exposure review",
    jurisdiction: "India / Bermuda",
    dueDate: "2026-10-01",
    status: "OPEN",
    severityWhenOpen: "BLOCKER",
    reason:
      "India–Bermuda has no configured DTAA; the calculated double-taxation exposure and settlement require completion.",
    evidenceReferences: [],
    ruleReference: "NON-DTAA-EXPOSURE-UAT-V1",
    provenanceReference: "Tax equalization UAT session record",
    revision: 3,
    updatedAt,
  },
  {
    obligationId: "OBL-SG-IMM-01",
    caseId: "MOB-NVL-063-IND-SG",
    sourceType: "MOBILITY_CASE",
    sourceId: "MOB-NVL-063-IND-SG",
    workstream: "IMMIGRATION",
    obligationType: "Business visitor coverage",
    jurisdiction: "Singapore",
    dueDate: "2026-10-01",
    status: "RESOLVED",
    severityWhenOpen: "REVIEW",
    reason: "Business visitor coverage evidence was required.",
    evidenceReferences: ["SG-UAT-BV-063"],
    ruleReference: "SG-BV-UAT",
    provenanceReference: "Immigration preflight",
    revision: 2,
    updatedAt,
  },
];

function specific(reason: string, fallback: string) {
  return reason.trim() || fallback;
}
export function evaluateMobilityReadiness(
  caseRecord: MobilityCase,
  obligations: ObligationRecord[],
  evaluationVersion = 1,
): ReadinessEvaluation {
  const caseObligations = obligations.filter(
    (item) => item.caseId === caseRecord.caseId,
  );
  const blockers: ReadinessBlocker[] = [];
  for (const obligation of caseObligations) {
    if (obligation.status === "OPEN")
      blockers.push({
        workstream: obligation.workstream,
        severity: obligation.severityWhenOpen,
        reason: specific(
          obligation.reason,
          `${obligation.obligationType} is open and requires action.`,
        ),
      });
    else if (obligation.status === "CANCELLED")
      blockers.push({
        workstream: obligation.workstream,
        severity: "REVIEW",
        reason: specific(
          obligation.reason,
          `${obligation.obligationType} was cancelled and requires human review.`,
        ),
      });
    else if (obligation.status !== "RESOLVED")
      blockers.push({
        workstream: obligation.workstream,
        severity: "BLOCKER",
        reason: `Obligation status unrecognized: ${String(obligation.status)}`,
      });
  }
  if (
    caseRecord.currentHostDays > caseRecord.defaultDayThreshold &&
    caseRecord.payrollModel !== "Shadow"
  )
    blockers.push({
      workstream: "DAYS",
      severity: "BLOCKER",
      reason: `Host days exceed the ${caseRecord.defaultDayThreshold}-day corridor threshold and shadow payroll is not configured.`,
    });
  if (caseRecord.compensationHomePct + caseRecord.compensationHostPct !== 100)
    blockers.push({
      workstream: "COMPENSATION",
      severity: "BLOCKER",
      reason: "Home and host compensation allocation must total 100%.",
    });
  for (const reason of caseRecord.unsupportedCalculations)
    blockers.push({
      workstream: "TAX",
      severity: "BLOCKER",
      reason: specific(
        reason,
        "A required corridor calculation is unsupported and remains fail closed.",
      ),
    });
  const computedStatus: ReadinessStatus = blockers.some(
    (x) => x.severity === "BLOCKER",
  )
    ? "BLOCKED"
    : blockers.some((x) => x.severity === "REVIEW")
      ? "REVIEW_REQUIRED"
      : "READY";
  return {
    caseId: caseRecord.caseId,
    evaluationVersion,
    computedStatus,
    blockers,
    evaluatedAt: updatedAt,
    sourceObligationRevisions: Object.fromEntries(
      caseObligations.map((x) => [x.obligationId, x.revision]),
    ),
  };
}

export function applyObligationChangeAndEvaluateReadiness(
  state: {
    caseRecord: MobilityCase;
    obligations: ObligationRecord[];
    evaluation: ReadinessEvaluation;
  },
  input: {
    caseId: string;
    obligationId: string;
    expectedRevision: number;
    change: Partial<ObligationRecord>;
  },
) {
  if (input.caseId !== state.caseRecord.caseId)
    return { error: "Case does not match the current UAT session." } as const;
  const current = state.obligations.find(
    (x) => x.obligationId === input.obligationId && x.caseId === input.caseId,
  );
  if (!current)
    return {
      error: "Obligation was not found in the current UAT session.",
    } as const;
  if (current.revision !== input.expectedRevision)
    return {
      error: `Stale edit rejected. Expected revision ${input.expectedRevision}; current revision is ${current.revision}. Reload this obligation and try again.`,
    } as const;
  if (input.change.caseId && input.change.caseId !== current.caseId)
    return { error: "An obligation cannot be moved to another case." } as const;
  const status = input.change.status ?? current.status;
  if (!["OPEN", "RESOLVED", "CANCELLED"].includes(status))
    return {
      error: `Obligation status unrecognized: ${String(status)}`,
    } as const;
  const next = {
    ...current,
    ...input.change,
    caseId: current.caseId,
    obligationId: current.obligationId,
    revision: current.revision + 1,
    updatedAt,
  };
  if (!next.reason.trim())
    return { error: "A specific obligation reason is required." } as const;
  const obligations = state.obligations.map((x) =>
    x.obligationId === next.obligationId ? next : x,
  );
  const evaluation = evaluateMobilityReadiness(
    state.caseRecord,
    obligations,
    state.evaluation.evaluationVersion + 1,
  );
  return { result: { obligations, evaluation } } as const;
}

export const MOBILITY_EVALUATIONS = Object.fromEntries(
  MOBILITY_CASE_FIXTURES.map((caseRecord) => [
    caseRecord.caseId,
    evaluateMobilityReadiness(caseRecord, OBLIGATION_FIXTURES),
  ]),
);
export function daysToExpiry(date: string | null, asOf = "2026-09-17") {
  if (!date) return null;
  return Math.ceil((Date.parse(date) - Date.parse(asOf)) / 86400000);
}

export function buildMobilityCaseFromPayrollEmployee(input: {
  employee: { id: string; name: string };
  hostCountry: string;
  assignmentType: MobilityCase["assignmentType"];
  owner: string;
  ordinal: number;
}): MobilityCase {
  const employeeId = input.employee.id.trim();
  const hostCountry = input.hostCountry.trim();
  if (!employeeId || !input.employee.name.trim() || !hostCountry)
    throw new Error("A payroll employee and host country are required.");
  return {
    caseId: `MOB-${employeeId}-UAT-${input.ordinal}`,
    employeeId,
    employeeName: input.employee.name.trim(),
    homeCountry: "India",
    hostCountry,
    assignmentType: input.assignmentType,
    lifecycleStatus: "Pre-assignment",
    startDate: "2026-10-01",
    endDate: "2027-03-31",
    owner: input.owner,
    payrollModel: "Standard",
    workAuthorizationExpiry: null,
    totalizationAgreement: false,
    dtaaExists: false,
    defaultDayThreshold: 183,
    currentHostDays: 0,
    compensationHomePct: 100,
    compensationHostPct: 0,
    unsupportedCalculations: [
      "Corridor tax and immigration rules are not configured for this new UAT case.",
    ],
    lastUpdated: "Current session",
  };
}

export function resolveMobilityCase(
  cases: MobilityCase[],
  caseId: string | null,
) {
  if (!caseId) return null;
  return cases.find((item) => item.caseId === caseId) ?? null;
}
