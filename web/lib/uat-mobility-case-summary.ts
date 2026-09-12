import { ADITI_INDIA_US_LEDGER, summarizeCompensationLedger } from "./uat-global-compensation-ledger";
import { calculateIndiaHypotheticalTax } from "./uat-india-hypothetical-tax";
import { ADITI_DAY_LEDGER, summarizeMobilityDayLedger } from "./uat-mobility-day-ledger";
import { assessAditiIndiaUsReadiness } from "./uat-mobility-readiness";

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

export function buildAditiIndiaUsCaseSummary(): MobilityCaseSummary {
  const readiness = assessAditiIndiaUsReadiness();
  const compensation = summarizeCompensationLedger(ADITI_INDIA_US_LEDGER);
  const dayLedger = summarizeMobilityDayLedger(ADITI_DAY_LEDGER);
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
    unresolvedCompensationItems: compensation.unresolved,
    substantialPresenceStatus: dayLedger.spt.status,
    openReviews: readiness.reviewCount,
    blockers: readiness.blockedCount,
    workstreams: [
      { id: "location", label: "Location and residency", status: gate("location-evidence"), href: "/uat/mobility/aditi-india-us/day-ledger" },
      { id: "compensation", label: "Global compensation", status: gate("compensation-treatment"), href: "/uat/mobility/aditi-india-us/compensation" },
      { id: "india-hypothetical-tax", label: "India hypothetical tax", status: gate("india-hypothetical-tax"), href: "/uat/mobility/aditi-india-us/hypothetical-tax" },
      { id: "us-tax", label: "US monetary tax", status: gate("us-tax-engine"), href: null },
      { id: "immigration", label: "Immigration", status: gate("immigration"), href: null },
      { id: "social-security", label: "Social security", status: gate("social-security"), href: null },
    ],
    ruleVersion: "niva-india-us-case-summary-uat-v1",
  };
}
