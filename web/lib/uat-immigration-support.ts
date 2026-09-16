export type ImmigrationSupportInput = {
  caseId: string;
  employeeName: string;
  citizenshipCountry: string;
  hostCountry: string;
  assignmentStartDate: string;
  assignmentEndDate: string;
  visaCategory: string;
  roleTitle: string;
  hostEmployer: string;
  primaryWorksite: string;
  petitionOrApprovalReference: string;
  workAuthorizationReference: string;
  workAuthorizationStartDate: string;
  workAuthorizationEndDate: string;
  passportReference: string;
  passportExpiryDate: string;
  reviewedBy: string;
  reviewedAt: string;
};

export type ImmigrationGateStatus = "PASS" | "ACTION_REQUIRED" | "BLOCKED";

export type ImmigrationGate = {
  id: string;
  label: string;
  status: ImmigrationGateStatus;
  detail: string;
  evidence: string[];
};

export type ImmigrationAction = {
  id: string;
  title: string;
  owner: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL";
  reason: string;
  status: "OPEN";
};

export type ImmigrationAlert = {
  id: string;
  severity: "CRITICAL" | "HIGH" | "INFO";
  message: string;
};

export type ImmigrationAssessment = {
  caseId: string;
  status: "PRECHECK_COMPLETE" | "ACTION_REQUIRED" | "BLOCKED";
  payrollActivationAllowed: false;
  specialistDecisionRequired: true;
  legalConclusion: "NOT_PROVIDED";
  gates: ImmigrationGate[];
  actions: ImmigrationAction[];
  alerts: ImmigrationAlert[];
  automationSummary: {
    passedGateCount: number;
    totalGateCount: number;
    openActionCount: number;
    criticalAlertCount: number;
    nextAction: string;
  };
  ruleVersion: "immigration-support-uat-v1";
};

export type ImmigrationAssistantAnswer = {
  intent: "BLOCKERS" | "NEXT_ACTION" | "ACTIVATION" | "EXPIRY" | "EVIDENCE" | "STATUS" | "UNSUPPORTED";
  answer: string;
  sources: string[];
  requiresSpecialistReview: true;
};

export const IMMIGRATION_SUPPORT_STORAGE_KEY = "india-payroll-os.mobility.aditi-immigration.v1";

export const EMPTY_IMMIGRATION_SUPPORT_INPUT: ImmigrationSupportInput = {
  caseId: "MOB-NVL-017-IND-US",
  employeeName: "Aditi Joshi",
  citizenshipCountry: "India",
  hostCountry: "United States",
  assignmentStartDate: "2026-10-01",
  assignmentEndDate: "2028-09-30",
  visaCategory: "",
  roleTitle: "",
  hostEmployer: "",
  primaryWorksite: "",
  petitionOrApprovalReference: "",
  workAuthorizationReference: "",
  workAuthorizationStartDate: "",
  workAuthorizationEndDate: "",
  passportReference: "",
  passportExpiryDate: "",
  reviewedBy: "",
  reviewedAt: "",
};

export const REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT: ImmigrationSupportInput = {
  caseId: "MOB-NVL-017-IND-US",
  employeeName: "Aditi Joshi",
  citizenshipCountry: "India",
  hostCountry: "United States",
  assignmentStartDate: "2026-10-01",
  assignmentEndDate: "2028-09-30",
  visaCategory: "L-1",
  roleTitle: "Engineering Director",
  hostEmployer: "Niva Labs USA Inc. (UAT)",
  primaryWorksite: "Austin, Texas (UAT)",
  petitionOrApprovalReference: "UAT-PETITION-017",
  workAuthorizationReference: "UAT-WORK-AUTH-017",
  workAuthorizationStartDate: "2026-09-20",
  workAuthorizationEndDate: "2028-09-30",
  passportReference: "UAT-PASSPORT-017",
  passportExpiryDate: "2030-05-31",
  reviewedBy: "UAT Immigration Reviewer",
  reviewedAt: "2026-09-15T10:15",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function dateOnly(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateTime(value: string): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function gate(id: string, label: string, status: ImmigrationGateStatus, detail: string, evidence: string[] = []): ImmigrationGate {
  return { id, label, status, detail, evidence };
}

export function assessImmigrationSupport(
  rawInput: Partial<ImmigrationSupportInput> | null | undefined,
  asOf = new Date(),
): ImmigrationAssessment {
  const input = { ...EMPTY_IMMIGRATION_SUPPORT_INPUT, ...(rawInput ?? {}) };
  const assignmentStart = dateOnly(text(input.assignmentStartDate));
  const assignmentEnd = dateOnly(text(input.assignmentEndDate));
  const authorizationStart = dateOnly(text(input.workAuthorizationStartDate));
  const authorizationEnd = dateOnly(text(input.workAuthorizationEndDate));
  const passportExpiry = dateOnly(text(input.passportExpiryDate));
  const reviewedAt = dateTime(text(input.reviewedAt));
  const today = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  const gates: ImmigrationGate[] = [];
  const actions: ImmigrationAction[] = [];
  const alerts: ImmigrationAlert[] = [];

  const identityEvidence = [text(input.caseId), text(input.employeeName), text(input.citizenshipCountry), text(input.hostCountry)];
  if (identityEvidence.some((value) => !value)) {
    gates.push(gate("case-facts", "Case and corridor facts", "ACTION_REQUIRED", "Case, employee, citizenship and host-country facts must all be recorded.", identityEvidence.filter(Boolean)));
    actions.push({ id: "complete-case-facts", title: "Complete the case and corridor facts", owner: "Mobility operations", priority: "HIGH", reason: "The preflight cannot ground its answers without an identified employee and corridor.", status: "OPEN" });
  } else {
    gates.push(gate("case-facts", "Case and corridor facts", "PASS", "The employee and mobility corridor are identified.", identityEvidence));
  }

  if (assignmentStart === null || assignmentEnd === null || assignmentEnd < assignmentStart) {
    gates.push(gate("assignment-window", "Assignment window", "BLOCKED", "Enter valid assignment start and end dates, with the end on or after the start.", [text(input.assignmentStartDate), text(input.assignmentEndDate)].filter(Boolean)));
    actions.push({ id: "correct-assignment-window", title: "Correct the assignment dates", owner: "Mobility operations", priority: "CRITICAL", reason: "Document coverage cannot be tested against an invalid assignment window.", status: "OPEN" });
    alerts.push({ id: "invalid-assignment-window", severity: "CRITICAL", message: "The assignment window is missing or invalid." });
  } else {
    gates.push(gate("assignment-window", "Assignment window", "PASS", "The assignment window is valid for coverage checks.", [input.assignmentStartDate, input.assignmentEndDate]));
  }

  const roleFacts = [text(input.visaCategory), text(input.roleTitle), text(input.hostEmployer), text(input.primaryWorksite)];
  if (roleFacts.some((value) => !value)) {
    gates.push(gate("role-and-classification", "Role and classification facts", "ACTION_REQUIRED", "Visa category, role, host employer and primary worksite must be captured for specialist review.", roleFacts.filter(Boolean)));
    actions.push({ id: "complete-role-facts", title: "Complete role and immigration classification facts", owner: "Mobility operations", priority: "HIGH", reason: "The captured visa label alone is not treated as proof of work authorization.", status: "OPEN" });
  } else {
    gates.push(gate("role-and-classification", "Role and classification facts", "PASS", "Role and classification facts are captured. No legal conclusion has been inferred from the visa category.", roleFacts));
  }

  const authorizationEvidence = [text(input.petitionOrApprovalReference), text(input.workAuthorizationReference)];
  if (authorizationEvidence.some((value) => !value) || authorizationStart === null || authorizationEnd === null) {
    gates.push(gate("work-authorization", "Work-authorization evidence", "ACTION_REQUIRED", "Record petition or approval evidence, work-authorization evidence and its coverage dates.", authorizationEvidence));
    actions.push({ id: "collect-work-authorization", title: "Collect work-authorization evidence and coverage dates", owner: "Immigration specialist", priority: "HIGH", reason: "Payroll activation cannot rely on a visa-category label or an incomplete evidence record.", status: "OPEN" });
    alerts.push({ id: "missing-work-authorization", severity: "HIGH", message: "Work-authorization evidence or coverage dates are incomplete." });
  } else if (authorizationEnd < today) {
    gates.push(gate("work-authorization", "Work-authorization evidence", "BLOCKED", "The recorded work-authorization end date is before the preflight date.", [...authorizationEvidence, input.workAuthorizationStartDate, input.workAuthorizationEndDate]));
    actions.push({ id: "escalate-expired-authorization", title: "Escalate expired work authorization", owner: "Immigration specialist", priority: "CRITICAL", reason: `The recorded authorization ended on ${input.workAuthorizationEndDate}.`, status: "OPEN" });
    alerts.push({ id: "expired-work-authorization", severity: "CRITICAL", message: `Recorded work authorization expired on ${input.workAuthorizationEndDate}.` });
  } else if (assignmentStart !== null && authorizationStart > assignmentStart) {
    gates.push(gate("work-authorization", "Work-authorization evidence", "BLOCKED", "Recorded work authorization begins after the assignment start date.", [...authorizationEvidence, input.workAuthorizationStartDate, input.workAuthorizationEndDate]));
    actions.push({ id: "resolve-authorization-start-gap", title: "Resolve the work-authorization start-date gap", owner: "Immigration specialist", priority: "CRITICAL", reason: "The recorded coverage does not begin by the assignment start.", status: "OPEN" });
    alerts.push({ id: "authorization-start-gap", severity: "CRITICAL", message: "The assignment begins before the recorded work-authorization coverage." });
  } else if (assignmentEnd !== null && authorizationEnd < assignmentEnd) {
    gates.push(gate("work-authorization", "Work-authorization evidence", "ACTION_REQUIRED", "Recorded work authorization does not cover the full assignment window.", [...authorizationEvidence, input.workAuthorizationStartDate, input.workAuthorizationEndDate]));
    actions.push({ id: "plan-authorization-extension", title: "Record the plan for the authorization coverage gap", owner: "Immigration specialist", priority: "HIGH", reason: "The recorded authorization ends before the assignment end date.", status: "OPEN" });
    alerts.push({ id: "authorization-coverage-gap", severity: "HIGH", message: `Recorded work authorization ends on ${input.workAuthorizationEndDate}, before the assignment ends.` });
  } else {
    gates.push(gate("work-authorization", "Work-authorization evidence", "PASS", "The recorded evidence dates cover the assignment window. A specialist must still validate legal sufficiency.", [...authorizationEvidence, input.workAuthorizationStartDate, input.workAuthorizationEndDate]));
  }

  if (!text(input.passportReference) || passportExpiry === null) {
    gates.push(gate("passport", "Passport evidence", "ACTION_REQUIRED", "Record a passport evidence reference and expiry date.", [text(input.passportReference)].filter(Boolean)));
    actions.push({ id: "collect-passport-evidence", title: "Collect passport evidence and expiry date", owner: "Employee and mobility operations", priority: "HIGH", reason: "The case file does not contain complete passport evidence.", status: "OPEN" });
  } else if (passportExpiry < today) {
    gates.push(gate("passport", "Passport evidence", "BLOCKED", "The recorded passport expiry date is before the preflight date.", [input.passportReference, input.passportExpiryDate]));
    actions.push({ id: "escalate-expired-passport", title: "Escalate the expired passport record", owner: "Employee and immigration specialist", priority: "CRITICAL", reason: `The recorded passport expired on ${input.passportExpiryDate}.`, status: "OPEN" });
    alerts.push({ id: "expired-passport", severity: "CRITICAL", message: `Recorded passport expired on ${input.passportExpiryDate}.` });
  } else if (assignmentEnd !== null && passportExpiry < assignmentEnd) {
    gates.push(gate("passport", "Passport evidence", "ACTION_REQUIRED", "The recorded passport expires before the assignment end date.", [input.passportReference, input.passportExpiryDate]));
    actions.push({ id: "plan-passport-renewal", title: "Record a passport-renewal plan", owner: "Employee and immigration specialist", priority: "HIGH", reason: "The recorded passport does not cover the full assignment window.", status: "OPEN" });
    alerts.push({ id: "passport-coverage-gap", severity: "HIGH", message: `Recorded passport expires on ${input.passportExpiryDate}, before the assignment ends.` });
  } else {
    gates.push(gate("passport", "Passport evidence", "PASS", "The recorded passport date covers the assignment window.", [input.passportReference, input.passportExpiryDate]));
  }

  if (!text(input.reviewedBy) || reviewedAt === null || reviewedAt > asOf.getTime()) {
    gates.push(gate("review-provenance", "Review provenance", "ACTION_REQUIRED", "Record a named reviewer and a valid review timestamp that is not in the future.", [text(input.reviewedBy), text(input.reviewedAt)].filter(Boolean)));
    actions.push({ id: "record-review-provenance", title: "Record immigration review provenance", owner: "Immigration specialist", priority: "HIGH", reason: "Automated checks do not replace a named specialist review.", status: "OPEN" });
  } else {
    gates.push(gate("review-provenance", "Review provenance", "PASS", "A named reviewer and review timestamp are recorded.", [input.reviewedBy, input.reviewedAt]));
  }

  actions.push({ id: "specialist-determination", title: "Record the specialist immigration determination", owner: "Immigration specialist", priority: "HIGH", reason: "This preflight organizes evidence but does not decide legal work authorization or approve payroll activation.", status: "OPEN" });

  const hasBlockedGate = gates.some((item) => item.status === "BLOCKED");
  const hasActionGate = gates.some((item) => item.status === "ACTION_REQUIRED");
  const status = hasBlockedGate ? "BLOCKED" : hasActionGate ? "ACTION_REQUIRED" : "PRECHECK_COMPLETE";

  return {
    caseId: text(input.caseId) || "UNIDENTIFIED-CASE",
    status,
    payrollActivationAllowed: false,
    specialistDecisionRequired: true,
    legalConclusion: "NOT_PROVIDED",
    gates,
    actions,
    alerts,
    automationSummary: {
      passedGateCount: gates.filter((item) => item.status === "PASS").length,
      totalGateCount: gates.length,
      openActionCount: actions.length,
      criticalAlertCount: alerts.filter((item) => item.severity === "CRITICAL").length,
      nextAction: actions[0]?.title ?? "Record the specialist immigration determination",
    },
    ruleVersion: "immigration-support-uat-v1",
  };
}

export function answerImmigrationQuestion(question: unknown, assessment: ImmigrationAssessment): ImmigrationAssistantAnswer {
  const normalized = text(question).toLowerCase();
  const nonPassing = assessment.gates.filter((item) => item.status !== "PASS");
  const sources = assessment.gates.flatMap((item) => item.evidence).filter(Boolean);
  const citedSources = Array.from(new Set(sources)).slice(0, 8);

  if (/block|missing|gap|risk|problem/.test(normalized)) {
    const summary = nonPassing.length
      ? nonPassing.map((item) => `${item.label}: ${item.detail}`).join(" ")
      : "All automated evidence gates pass. A specialist determination is still required.";
    return { intent: "BLOCKERS", answer: summary, sources: citedSources, requiresSpecialistReview: true };
  }

  if (/next|action|do now|priority/.test(normalized)) {
    const next = assessment.actions.slice(0, 3).map((item, index) => `${index + 1}. ${item.title} (${item.owner}).`).join(" ");
    return { intent: "NEXT_ACTION", answer: next || "Record the specialist immigration determination.", sources: citedSources, requiresSpecialistReview: true };
  }

  if (/payroll|activate|approved|authorized|can (she|he|they)|can work|safe to start/.test(normalized)) {
    return {
      intent: "ACTIVATION",
      answer: `No automatic approval is available. Payroll activation remains blocked by design. The current preflight status is ${assessment.status.replaceAll("_", " ")}, and a specialist immigration determination must be recorded.`,
      sources: citedSources,
      requiresSpecialistReview: true,
    };
  }

  if (/expir|valid until|end date|coverage/.test(normalized)) {
    const expiryGates = assessment.gates.filter((item) => item.id === "work-authorization" || item.id === "passport");
    return { intent: "EXPIRY", answer: expiryGates.map((item) => `${item.label}: ${item.detail}`).join(" "), sources: expiryGates.flatMap((item) => item.evidence), requiresSpecialistReview: true };
  }

  if (/evidence|document|reference|proof/.test(normalized)) {
    const evidence = assessment.gates.map((item) => `${item.label}: ${item.evidence.length ? item.evidence.join(", ") : "no evidence recorded"}`).join(" ");
    return { intent: "EVIDENCE", answer: evidence, sources: citedSources, requiresSpecialistReview: true };
  }

  if (/status|summary|ready|preflight/.test(normalized)) {
    return {
      intent: "STATUS",
      answer: `Status: ${assessment.status.replaceAll("_", " ")}. ${assessment.automationSummary.passedGateCount} of ${assessment.automationSummary.totalGateCount} automated gates pass, with ${assessment.automationSummary.openActionCount} open actions. This is an operational preflight, not a legal conclusion.`,
      sources: citedSources,
      requiresSpecialistReview: true,
    };
  }

  return {
    intent: "UNSUPPORTED",
    answer: "I can summarize this case's blockers, evidence, expiry coverage, status and next actions. I cannot interpret immigration law, predict an adjudication, or approve work authorization. Ask an immigration specialist for a legal determination.",
    sources: [],
    requiresSpecialistReview: true,
  };
}
