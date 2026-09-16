export const MOBILITY_RESOLUTION_STORAGE_KEY = "india-payroll-os.mobility.aditi-resolution.v1";

export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"],
] as const;

export type MobilityResolutionDraft = {
  locationEvidence: {
    evidenceReference: string;
    reviewedBy: string;
    reviewedAt: string;
  };
  hostState: {
    stateCode: string;
    assignmentLetterReference: string;
    primaryWorksiteReference: string;
    hrProfileReference: string;
    reviewedBy: string;
    reviewedAt: string;
    approvalReference: string;
  };
  compensation: {
    housingJurisdiction: string;
    housingTreatment: string;
    housingEvidenceReference: string;
    mobilityJurisdiction: string;
    mobilityTreatment: string;
    mobilityEvidenceReference: string;
    reviewedBy: string;
    reviewedAt: string;
  };
  immigration: {
    visaCategory: string;
    workAuthorizationReference: string;
    reviewedBy: string;
    reviewedAt: string;
  };
  socialSecurity: {
    position: string;
    assessmentReference: string;
    reviewedBy: string;
    reviewedAt: string;
  };
};

export type HumanResolutionGateId =
  | "location-evidence"
  | "host-state"
  | "compensation-treatment"
  | "immigration"
  | "social-security";

export type MobilityResolutionAssessment = {
  gates: Record<HumanResolutionGateId, { ready: boolean; errors: string[] }>;
  readyCount: number;
  totalCount: 5;
  allHumanGatesReady: boolean;
  systemBlocker: "US_MONETARY_TAX_ENGINE_UNVERIFIED";
};

export const EMPTY_MOBILITY_RESOLUTION: MobilityResolutionDraft = {
  locationEvidence: { evidenceReference: "", reviewedBy: "", reviewedAt: "" },
  hostState: {
    stateCode: "",
    assignmentLetterReference: "",
    primaryWorksiteReference: "",
    hrProfileReference: "",
    reviewedBy: "",
    reviewedAt: "",
    approvalReference: "",
  },
  compensation: {
    housingJurisdiction: "",
    housingTreatment: "",
    housingEvidenceReference: "",
    mobilityJurisdiction: "",
    mobilityTreatment: "",
    mobilityEvidenceReference: "",
    reviewedBy: "",
    reviewedAt: "",
  },
  immigration: { visaCategory: "", workAuthorizationReference: "", reviewedBy: "", reviewedAt: "" },
  socialSecurity: { position: "", assessmentReference: "", reviewedBy: "", reviewedAt: "" },
};

export const REPRESENTATIVE_MOBILITY_RESOLUTION: MobilityResolutionDraft = {
  locationEvidence: {
    evidenceReference: "UAT-I94-ADITI-2026-01-14",
    reviewedBy: "UAT Mobility Reviewer",
    reviewedAt: "2026-09-15T09:30",
  },
  hostState: {
    stateCode: "CA",
    assignmentLetterReference: "UAT-ASSIGNMENT-LETTER-017",
    primaryWorksiteReference: "UAT-WORKSITE-CONFIRMATION-017",
    hrProfileReference: "UAT-HR-PROFILE-017",
    reviewedBy: "UAT Mobility Tax Reviewer",
    reviewedAt: "2026-09-15T09:45",
    approvalReference: "UAT-HOST-STATE-APPROVAL-017",
  },
  compensation: {
    housingJurisdiction: "United States",
    housingTreatment: "shadow-payroll",
    housingEvidenceReference: "UAT-HOUSING-TREATMENT-017",
    mobilityJurisdiction: "Both",
    mobilityTreatment: "mobility-only",
    mobilityEvidenceReference: "UAT-MOBILITY-TREATMENT-017",
    reviewedBy: "UAT Global Payroll Reviewer",
    reviewedAt: "2026-09-15T10:00",
  },
  immigration: {
    visaCategory: "L-1",
    workAuthorizationReference: "UAT-WORK-AUTH-017",
    reviewedBy: "UAT Immigration Reviewer",
    reviewedAt: "2026-09-15T10:15",
  },
  socialSecurity: {
    position: "dual-contribution-review-complete",
    assessmentReference: "UAT-SOCIAL-SECURITY-ASSESSMENT-017",
    reviewedBy: "UAT Mobility Compliance Reviewer",
    reviewedAt: "2026-09-15T10:30",
  },
};

function required(value: string, label: string, errors: string[]) {
  if (!value.trim()) errors.push(`${label} is required.`);
}

function reviewTime(value: string, errors: string[], now: Date) {
  if (!value) {
    errors.push("Review date and time is required.");
    return;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) errors.push("Review date and time is invalid.");
  else if (parsed.getTime() > now.getTime()) errors.push("Review date and time cannot be in the future.");
}

export function assessMobilityResolution(
  draft: MobilityResolutionDraft,
  now: Date = new Date(),
): MobilityResolutionAssessment {
  const locationErrors: string[] = [];
  required(draft.locationEvidence.evidenceReference, "Corroborating evidence reference", locationErrors);
  required(draft.locationEvidence.reviewedBy, "Reviewer", locationErrors);
  reviewTime(draft.locationEvidence.reviewedAt, locationErrors, now);

  const hostStateErrors: string[] = [];
  if (!US_STATES.some(([code]) => code === draft.hostState.stateCode)) hostStateErrors.push("A valid U.S. host state is required.");
  required(draft.hostState.assignmentLetterReference, "Assignment letter reference", hostStateErrors);
  required(draft.hostState.primaryWorksiteReference, "Primary worksite reference", hostStateErrors);
  required(draft.hostState.hrProfileReference, "HR or payroll profile reference", hostStateErrors);
  required(draft.hostState.reviewedBy, "Reviewer", hostStateErrors);
  reviewTime(draft.hostState.reviewedAt, hostStateErrors, now);
  required(draft.hostState.approvalReference, "Approval reference", hostStateErrors);

  const compensationErrors: string[] = [];
  required(draft.compensation.housingJurisdiction, "Housing jurisdiction", compensationErrors);
  required(draft.compensation.housingTreatment, "Housing payroll treatment", compensationErrors);
  required(draft.compensation.housingEvidenceReference, "Housing evidence reference", compensationErrors);
  required(draft.compensation.mobilityJurisdiction, "Mobility allowance jurisdiction", compensationErrors);
  required(draft.compensation.mobilityTreatment, "Mobility allowance payroll treatment", compensationErrors);
  required(draft.compensation.mobilityEvidenceReference, "Mobility allowance evidence reference", compensationErrors);
  required(draft.compensation.reviewedBy, "Reviewer", compensationErrors);
  reviewTime(draft.compensation.reviewedAt, compensationErrors, now);

  const immigrationErrors: string[] = [];
  required(draft.immigration.visaCategory, "Visa category", immigrationErrors);
  required(draft.immigration.workAuthorizationReference, "Work-authorization evidence reference", immigrationErrors);
  required(draft.immigration.reviewedBy, "Reviewer", immigrationErrors);
  reviewTime(draft.immigration.reviewedAt, immigrationErrors, now);

  const socialSecurityErrors: string[] = [];
  required(draft.socialSecurity.position, "Documented social-security position", socialSecurityErrors);
  required(draft.socialSecurity.assessmentReference, "Assessment reference", socialSecurityErrors);
  required(draft.socialSecurity.reviewedBy, "Reviewer", socialSecurityErrors);
  reviewTime(draft.socialSecurity.reviewedAt, socialSecurityErrors, now);

  const gates = {
    "location-evidence": { ready: locationErrors.length === 0, errors: locationErrors },
    "host-state": { ready: hostStateErrors.length === 0, errors: hostStateErrors },
    "compensation-treatment": { ready: compensationErrors.length === 0, errors: compensationErrors },
    immigration: { ready: immigrationErrors.length === 0, errors: immigrationErrors },
    "social-security": { ready: socialSecurityErrors.length === 0, errors: socialSecurityErrors },
  } satisfies MobilityResolutionAssessment["gates"];
  const readyCount = Object.values(gates).filter((gate) => gate.ready).length;

  return {
    gates,
    readyCount,
    totalCount: 5,
    allHumanGatesReady: readyCount === 5,
    systemBlocker: "US_MONETARY_TAX_ENGINE_UNVERIFIED",
  };
}

