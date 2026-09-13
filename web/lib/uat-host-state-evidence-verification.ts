export const HOST_STATE_EVIDENCE_ITEM_IDS = [
  "assignment-letter",
  "primary-worksite",
  "hr-payroll-profile",
] as const;

export type HostStateEvidenceItemId = (typeof HOST_STATE_EVIDENCE_ITEM_IDS)[number];

export type HostStateEvidenceVerificationInput = {
  evidenceItemId: string;
  evidenceReference: string;
  reviewerId: string;
  verifiedAt: string;
};

export type HostStateEvidenceVerificationValidation = {
  accepted: boolean;
  errors: string[];
};

export type HostStateEvidenceVerificationRecord = {
  sequence: number;
  evidenceItemId: HostStateEvidenceItemId;
  evidenceReference: string;
  reviewerId: string;
  verifiedAt: string;
  recordedAt: string;
};

export type HostStateEvidenceVerificationRecordResult = HostStateEvidenceVerificationValidation & {
  record: HostStateEvidenceVerificationRecord | null;
  auditHistory: HostStateEvidenceVerificationRecord[];
};

export function validateHostStateEvidenceVerification(
  input: HostStateEvidenceVerificationInput,
  authenticatedReviewerId: string | null,
  now: Date = new Date(),
): HostStateEvidenceVerificationValidation {
  const errors: string[] = [];

  if (!HOST_STATE_EVIDENCE_ITEM_IDS.includes(input.evidenceItemId as HostStateEvidenceItemId)) {
    errors.push("Evidence item is not part of the authoritative host-state checklist.");
  }

  if (!input.evidenceReference.trim()) {
    errors.push("Evidence source reference is required.");
  }

  if (!authenticatedReviewerId) {
    errors.push("An authenticated reviewer identity is required.");
  } else if (input.reviewerId !== authenticatedReviewerId) {
    errors.push("Reviewer identity must match the authenticated reviewer.");
  }

  const verifiedAt = new Date(input.verifiedAt);
  if (!input.verifiedAt || Number.isNaN(verifiedAt.getTime())) {
    errors.push("Verification timestamp must be a valid ISO timestamp.");
  } else if (verifiedAt.getTime() > now.getTime()) {
    errors.push("Verification timestamp cannot be in the future.");
  }

  return {
    accepted: errors.length === 0,
    errors,
  };
}

export function buildHostStateEvidenceVerificationRecord(
  input: HostStateEvidenceVerificationInput,
  authenticatedReviewerId: string | null,
  existingAuditHistory: readonly HostStateEvidenceVerificationRecord[],
  now: Date = new Date(),
): HostStateEvidenceVerificationRecordResult {
  const validation = validateHostStateEvidenceVerification(input, authenticatedReviewerId, now);

  if (!validation.accepted) {
    return {
      ...validation,
      record: null,
      auditHistory: [...existingAuditHistory],
    };
  }

  const record: HostStateEvidenceVerificationRecord = {
    sequence: existingAuditHistory.length + 1,
    evidenceItemId: input.evidenceItemId as HostStateEvidenceItemId,
    evidenceReference: input.evidenceReference.trim(),
    reviewerId: authenticatedReviewerId as string,
    verifiedAt: new Date(input.verifiedAt).toISOString(),
    recordedAt: now.toISOString(),
  };

  return {
    accepted: true,
    errors: [],
    record,
    auditHistory: [...existingAuditHistory, record],
  };
}
