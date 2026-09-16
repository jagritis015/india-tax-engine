import { ADITI_INDIA_US_LEDGER, summarizeCompensationLedger } from "./uat-global-compensation-ledger";
import { assessHostStateAuthorityReview } from "./uat-host-state-authority-review";
import { calculateIndiaHypotheticalTax } from "./uat-india-hypothetical-tax";
import { ADITI_DAY_LEDGER, summarizeMobilityDayLedger } from "./uat-mobility-day-ledger";
import { assessAditiIndiaUsReadiness } from "./uat-mobility-readiness";

type HostStateEvidenceItem = {
  id: string;
  label: string;
  status: "MISSING" | "VERIFIED";
  evidenceReference: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
};

export type MobilityCaseSummary = {
  caseId: "MOB-NVL-017-IND-US";
  employeeId: "NVL-017";
  employeeName: "Aditi Joshi";
  corridor: "India to United States";
  overallStatus: "READY" | "REVIEW_REQUIRED" | "BLOCKED";
  payrollActivationAllowed: boolean;
  monthlyAssignmentCompInr: number;
  monthlyStayAtHomeGrossInr: number;
  hypotheticalMonthlyWithholdingInr: number | null;
  pendingDayEvidence: number;
  dayEvidenceProvenance: {
    source: "auditable-day-ledger";
    ledgerHref: string;
    totalEntries: number;
    verifiedEntries: number;
    pendingEntries: number;
    currentYearPhysicalDays: number;
    priorYearPhysicalDays: number;
    secondPriorYearPhysicalDays: number;
    substantialPresenceRuleVersion: string;
  };
  hostStateEvidence: {
    status: "UNVERIFIED";
    source: "assignment-profile";
    evidenceHref: "/uat/mobility/aditi-india-us/host-state";
    requiredEvidence: string[];
    verificationPolicy: string;
    evidenceItems: HostStateEvidenceItem[];
    verifiedEvidenceItems: number;
    totalEvidenceItems: number;
    allRequiredEvidenceVerified: boolean;
    blockingReason: string;
    nextAction: string;
    authorityReviewStatus: "BLOCKED" | "REVIEW_REQUIRED" | "APPROVED";
    candidateState: string | null;
    authoritativeState: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    approvalReference: string | null;
    stateTaxAssessmentAllowed: false;
  };
  unresolvedCompensationItems: number;
  substantialPresenceStatus: string;
  openReviews: number;
  blockers: number;
  workstreams: Array<{
    id: string;
    label: string;
    status: "READY" | "REVIEW_REQUIRED" | "BLOCKED";
    href: string | null;
  }>;
  ruleVersion: "niva-india-us-case-summary-uat-v1";
};

export function buildHostStateEvidenceItem(input: {
  id: string;
  label: string;
  evidenceReference?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}): HostStateEvidenceItem {
  const evidenceReference = input.evidenceReference?.trim() || null;
  const verifiedBy = input.verifiedBy?.trim() || null;
  const verifiedAt = input.verifiedAt?.trim() || null;
  const hasCompleteVerificationProvenance = Boolean(evidenceReference && verifiedBy && verifiedAt);

  return {
    id: input.id,
    label: input.label,
    status: hasCompleteVerificationProvenance ? "VERIFIED" : "MISSING",
    evidenceReference,
    verifiedBy,
    verifiedAt,
  };
}

export function areAllHostStateEvidenceItemsVerified(items: HostStateEvidenceItem[]): boolean {
  return (
    items.length > 0 &&
    items.every(
      (item) =>
        item.status === "VERIFIED" &&
        Boolean(item.evidenceReference && item.verifiedBy && item.verifiedAt),
    )
  );
}

export function buildAditiIndiaUsCaseSummary(): MobilityCaseSummary {
  const compensation = summarizeCompensationLedger(ADITI_INDIA_US_LEDGER);
  const dayLedger = summarizeMobilityDayLedger(ADITI_DAY_LEDGER);
  const verifiedDayEvidence = ADITI_DAY_LEDGER.filter((entry) => entry.evidenceStatus === "verified").length;
  const firstPendingDayEvidenceId = ADITI_DAY_LEDGER.find((entry) => entry.evidenceStatus === "pending")?.id;
  const dayLedgerHref = `/uat/mobility/aditi-india-us/day-ledger${firstPendingDayEvidenceId ? `#evidence-${firstPendingDayEvidenceId}` : ""}`;
  const hostStateEvidenceHref = "/uat/mobility/aditi-india-us/host-state" as const;
  const hostStateEvidenceItems = [
    buildHostStateEvidenceItem({ id: "assignment-letter", label: "Signed assignment letter or amendment naming the primary US work location" }),
    buildHostStateEvidenceItem({ id: "primary-worksite", label: "Employer-confirmed primary worksite address" }),
    buildHostStateEvidenceItem({ id: "hr-payroll-profile", label: "Corroborating payroll or HR assignment profile" }),
  ];
  const allRequiredHostStateEvidenceVerified = areAllHostStateEvidenceItemsVerified(hostStateEvidenceItems);
  const authorityReview = assessHostStateAuthorityReview({ allRequiredEvidenceVerified: allRequiredHostStateEvidenceVerified });
  const readiness = assessAditiIndiaUsReadiness({ allRequiredHostStateEvidenceVerified });
  const hypotheticalTax = calculateIndiaHypotheticalTax({
    employeeId: "NVL-017",
    employeeName: "Aditi Joshi",
    monthlyStayAtHomeGross: compensation.hypoMonthlyInr,
    taxableSalaryYtd: compensation.hypoMonthlyInr * 5,
    tdsDeductedYtd: 0,
  });

  const gate = (id: string) => readiness.gates.find((item) => item.id === id)?.status ?? "REVIEW_REQUIRED";

  return {
    caseId: readiness.caseId,
    employeeId: readiness.employeeId,
    employeeName: readiness.employeeName,
    corridor: readiness.corridor,
    overallStatus: readiness.status,
    payrollActivationAllowed: readiness.payrollActivationAllowed,
    monthlyAssignmentCompInr: compensation.monthlyInr,
    monthlyStayAtHomeGrossInr: compensation.hypoMonthlyInr,
    hypotheticalMonthlyWithholdingInr: hypotheticalTax.hypotheticalMonthlyWithholding,
    pendingDayEvidence: dayLedger.pendingEvidence,
    dayEvidenceProvenance: {
      source: "auditable-day-ledger", ledgerHref: dayLedgerHref, totalEntries: ADITI_DAY_LEDGER.length,
      verifiedEntries: verifiedDayEvidence, pendingEntries: dayLedger.pendingEvidence,
      currentYearPhysicalDays: dayLedger.current.physical, priorYearPhysicalDays: dayLedger.prior.physical,
      secondPriorYearPhysicalDays: dayLedger.second.physical, substantialPresenceRuleVersion: dayLedger.spt.ruleVersion,
    },
    hostStateEvidence: {
      status: "UNVERIFIED", source: "assignment-profile", evidenceHref: hostStateEvidenceHref,
      requiredEvidence: hostStateEvidenceItems.map((item) => item.label),
      verificationPolicy: "An evidence item may be marked VERIFIED only when its source reference, reviewer identity, and verification timestamp are recorded. All required evidence items must be VERIFIED before the host-state evidence gate may progress.",
      evidenceItems: hostStateEvidenceItems,
      verifiedEvidenceItems: hostStateEvidenceItems.filter((item) => item.status === "VERIFIED").length,
      totalEvidenceItems: hostStateEvidenceItems.length,
      allRequiredEvidenceVerified: allRequiredHostStateEvidenceVerified,
      blockingReason: "Authoritative U.S. host state is not established, so state and local tax scope cannot be assessed.",
      nextAction: "Verify all required host-state evidence before establishing the authoritative work location or enabling state-tax assessment.",
      authorityReviewStatus: authorityReview.status,
      candidateState: authorityReview.candidateState,
      authoritativeState: authorityReview.authoritativeState,
      reviewedBy: authorityReview.reviewedBy,
      reviewedAt: authorityReview.reviewedAt,
      approvalReference: authorityReview.approvalReference,
      stateTaxAssessmentAllowed: authorityReview.stateTaxAssessmentAllowed,
    },
    unresolvedCompensationItems: compensation.unresolved,
    substantialPresenceStatus: dayLedger.spt.status,
    openReviews: readiness.reviewCount,
    blockers: readiness.blockedCount,
    workstreams: [
      { id: "location", label: "Location and residency", status: gate("location-evidence"), href: dayLedgerHref },
      { id: "host-state", label: "US host state", status: gate("host-state"), href: hostStateEvidenceHref },
      { id: "compensation", label: "Global compensation", status: gate("compensation-treatment"), href: "/uat/mobility/aditi-india-us/compensation" },
      { id: "india-hypothetical-tax", label: "India hypothetical tax", status: gate("india-hypothetical-tax"), href: "/uat/mobility/aditi-india-us/hypothetical-tax" },
      { id: "us-tax", label: "US monetary tax", status: gate("us-tax-engine"), href: "/uat/mobility/aditi-india-us/readiness#resolution-us-tax-engine" },
      { id: "immigration", label: "Immigration", status: gate("immigration"), href: "/uat/mobility/aditi-india-us/immigration" },
      { id: "social-security", label: "Social security", status: gate("social-security"), href: "/uat/mobility/aditi-india-us/readiness#resolution-social-security" },
    ],
    ruleVersion: "niva-india-us-case-summary-uat-v1",
  };
}
