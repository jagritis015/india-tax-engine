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

export type HostStateEvidenceVerificationRequest = Omit<
  HostStateEvidenceVerificationInput,
  "reviewerId"
>;

export type HostStateEvidenceReviewerContext = {
  reviewerId: string | null;
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

export interface HostStateEvidenceVerificationAuditRepository {
  read(caseId: string): Promise<readonly HostStateEvidenceVerificationRecord[]>;
  append(caseId: string, record: HostStateEvidenceVerificationRecord): Promise<void>;
}

export type HostStateEvidenceVerificationPersistResult = HostStateEvidenceVerificationValidation & {
  record: HostStateEvidenceVerificationRecord | null;
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

export async function persistHostStateEvidenceVerification(
  caseId: string,
  input: HostStateEvidenceVerificationInput,
  authenticatedReviewerId: string | null,
  repository: HostStateEvidenceVerificationAuditRepository,
  now: Date = new Date(),
): Promise<HostStateEvidenceVerificationPersistResult> {
  const existingAuditHistory = await repository.read(caseId);
  const result = buildHostStateEvidenceVerificationRecord(
    input,
    authenticatedReviewerId,
    existingAuditHistory,
    now,
  );

  if (!result.accepted || !result.record) {
    return {
      accepted: false,
      errors: result.errors,
      record: null,
    };
  }

  await repository.append(caseId, result.record);

  return {
    accepted: true,
    errors: [],
    record: result.record,
  };
}

export async function persistHostStateEvidenceVerificationFromReviewerContext(
  caseId: string,
  request: HostStateEvidenceVerificationRequest,
  reviewerContext: HostStateEvidenceReviewerContext,
  repository: HostStateEvidenceVerificationAuditRepository,
  now: Date = new Date(),
): Promise<HostStateEvidenceVerificationPersistResult> {
  const reviewerId = reviewerContext.reviewerId;
  const trustedInput: HostStateEvidenceVerificationInput = {
    evidenceItemId: request.evidenceItemId,
    evidenceReference: request.evidenceReference,
    reviewerId: reviewerId ?? "",
    verifiedAt: request.verifiedAt,
  };

  return persistHostStateEvidenceVerification(
    caseId,
    trustedInput,
    reviewerId,
    repository,
    now,
  );
}
