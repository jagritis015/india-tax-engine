import { ADITI_INDIA_US_LEDGER, summarizeCompensationLedger } from "./uat-global-compensation-ledger";
import { calculateIndiaHypotheticalTax } from "./uat-india-hypothetical-tax";
import { ADITI_DAY_LEDGER, summarizeMobilityDayLedger } from "./uat-mobility-day-ledger";

export type MobilityReadinessGateStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type MobilityReadinessGate = {
  id: string;
  label: string;
  owner: string;
  status: MobilityReadinessGateStatus;
  detail: string;
  evidence: string;
};

export type MobilityReadinessSnapshot = {
  caseId: "MOB-NVL-017-IND-US";
  employeeId: "NVL-017";
  employeeName: "Aditi Joshi";
  corridor: "India to United States";
  status: "READY" | "REVIEW_REQUIRED" | "BLOCKED";
  payrollActivationAllowed: boolean;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  gates: MobilityReadinessGate[];
  evidenceSummary: {
    pendingDayEvidence: number;
    unresolvedCompensationItems: number;
    substantialPresenceStatus: string;
    indiaHypotheticalTaxStatus: string;
  };
  nextActions: string[];
  ruleVersion: "niva-india-us-readiness-uat-v1";
};

export function resolveHostStateReadinessGateStatus(allRequiredEvidenceVerified: boolean): MobilityReadinessGateStatus {
  return allRequiredEvidenceVerified ? "REVIEW_REQUIRED" : "BLOCKED";
}

export function assessAditiIndiaUsReadiness(input: { allRequiredHostStateEvidenceVerified?: boolean } = {}): MobilityReadinessSnapshot {
  const dayLedger = summarizeMobilityDayLedger(ADITI_DAY_LEDGER);
  const compensation = summarizeCompensationLedger(ADITI_INDIA_US_LEDGER);
  const indiaHypotheticalTax = calculateIndiaHypotheticalTax({
    employeeId: "NVL-017",
    employeeName: "Aditi Joshi",
    monthlyStayAtHomeGross: compensation.hypoMonthlyInr,
    taxableSalaryYtd: compensation.hypoMonthlyInr * 5,
    tdsDeductedYtd: 0,
  });
  const allRequiredHostStateEvidenceVerified = input.allRequiredHostStateEvidenceVerified === true;

  const gates: MobilityReadinessGate[] = [
    {
      id: "location-evidence",
      label: "Location evidence",
      owner: "Mobility operations",
      status: dayLedger.pendingEvidence ? "REVIEW_REQUIRED" : "READY",
      detail: dayLedger.pendingEvidence
        ? `${dayLedger.pendingEvidence} physical-presence day still needs corroborating evidence.`
        : "Every physical-presence day has verified supporting evidence.",
      evidence: "Workday and travel ledger",
    },
    {
      id: "host-state",
      label: "US host state",
      owner: "Mobility tax",
      status: resolveHostStateReadinessGateStatus(allRequiredHostStateEvidenceVerified),
      detail: allRequiredHostStateEvidenceVerified
        ? "All required host-state evidence is verified. Authoritative state selection still requires controlled review before state or local tax assessment can be enabled."
        : "The host state evidence set is incomplete or unverified, so state and local tax scope cannot be assessed.",
      evidence: "Assignment profile and verified host-state evidence",
    },
    {
      id: "compensation-treatment",
      label: "Compensation treatment",
      owner: "Global payroll",
      status: compensation.unresolved ? "REVIEW_REQUIRED" : "READY",
      detail: compensation.unresolved
        ? `${compensation.unresolved} compensation items still need jurisdiction, payroll-treatment, or evidence review.`
        : "Every compensation item has an evidence-backed jurisdiction and payroll treatment.",
      evidence: "Global compensation ledger",
    },
    {
      id: "india-hypothetical-tax",
      label: "India hypothetical tax",
      owner: "India payroll",
      status: indiaHypotheticalTax.status === "CALCULATED" ? "READY" : "REVIEW_REQUIRED",
      detail: indiaHypotheticalTax.status === "CALCULATED"
        ? "The policy-defined India hypothetical tax is calculable through the deterministic India engine."
        : indiaHypotheticalTax.reviewReason ?? "India hypothetical tax requires review.",
      evidence: "Tax equalization policy and India payroll engine",
    },
    {
      id: "us-tax-engine",
      label: "US monetary tax",
      owner: "US mobility tax",
      status: "BLOCKED",
      detail: "Federal, state, and local monetary tax engines are not verified and remain fail-closed.",
      evidence: "Verified US tax engine required",
    },
    {
      id: "immigration",
      label: "Immigration and work authorization",
      owner: "Immigration specialist",
      status: "REVIEW_REQUIRED",
      detail: "Visa category and work-authorization evidence must be verified before payroll activation.",
      evidence: "Immigration case file",
    },
    {
      id: "social-security",
      label: "Social security position",
      owner: "Mobility compliance",
      status: "REVIEW_REQUIRED",
      detail: "India and US social-security treatment requires a documented specialist position.",
      evidence: "Social-security assessment",
    },
  ];

  const readyCount = gates.filter((gate) => gate.status === "READY").length;
  const reviewCount = gates.filter((gate) => gate.status === "REVIEW_REQUIRED").length;
  const blockedCount = gates.filter((gate) => gate.status === "BLOCKED").length;
  const payrollActivationAllowed = blockedCount === 0 && reviewCount === 0;

  return {
    caseId: "MOB-NVL-017-IND-US",
    employeeId: "NVL-017",
    employeeName: "Aditi Joshi",
    corridor: "India to United States",
    status: blockedCount ? "BLOCKED" : reviewCount ? "REVIEW_REQUIRED" : "READY",
    payrollActivationAllowed,
    readyCount,
    reviewCount,
    blockedCount,
    gates,
    evidenceSummary: {
      pendingDayEvidence: dayLedger.pendingEvidence,
      unresolvedCompensationItems: compensation.unresolved,
      substantialPresenceStatus: dayLedger.spt.status,
      indiaHypotheticalTaxStatus: indiaHypotheticalTax.status,
    },
    nextActions: [
      "Verify the US host state and applicable state or local tax scope.",
      "Resolve pending physical-presence evidence in the day ledger.",
      "Approve jurisdiction and payroll treatment for assignment allowances.",
      "Attach verified immigration and work-authorization evidence.",
      "Document the India and US social-security position.",
      "Keep actual US monetary tax and host-payroll activation blocked until verified engines are available.",
    ],
    ruleVersion: "niva-india-us-readiness-uat-v1",
  };
}
