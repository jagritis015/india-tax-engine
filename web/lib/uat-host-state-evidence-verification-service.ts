import {
  persistHostStateEvidenceVerificationFromReviewerContext,
  type HostStateEvidenceReviewerContext,
  type HostStateEvidenceVerificationAuditRepository,
  type HostStateEvidenceVerificationPersistResult,
  type HostStateEvidenceVerificationRequest,
} from "./uat-host-state-evidence-verification";

export type HostStateEvidenceVerificationServiceContext = {
  reviewer: HostStateEvidenceReviewerContext;
  repository: HostStateEvidenceVerificationAuditRepository;
};

export async function verifyHostStateEvidenceForCase(
  caseId: string,
  request: HostStateEvidenceVerificationRequest,
  context: HostStateEvidenceVerificationServiceContext,
  now: Date = new Date(),
): Promise<HostStateEvidenceVerificationPersistResult> {
  const normalizedCaseId = caseId.trim();

  if (!normalizedCaseId) {
    return {
      accepted: false,
      errors: ["Case identifier is required."],
      record: null,
    };
  }

  return persistHostStateEvidenceVerificationFromReviewerContext(
    normalizedCaseId,
    request,
    context.reviewer,
    context.repository,
    now,
  );
}
