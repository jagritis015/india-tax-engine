import {
  persistHostStateEvidenceVerificationFromReviewerContext,
  type HostStateEvidenceReviewerContext,
  type HostStateEvidenceVerificationAuditRepository,
  type HostStateEvidenceVerificationPersistResult,
  type HostStateEvidenceVerificationRequest,
} from "./uat-host-state-evidence-verification";

export type HostStateEvidencePersistenceCapability = {
  durableWritesEnabled: boolean;
  bindingName: string | null;
};

export type HostStateEvidencePersistenceRuntimeState = {
  approved: boolean;
  durableBindingPresent: boolean;
  bindingName: string | null | undefined;
};

export function resolveHostStateEvidencePersistenceCapability(
  runtime: HostStateEvidencePersistenceRuntimeState,
): HostStateEvidencePersistenceCapability {
  const normalizedBindingName = runtime.bindingName?.trim() || null;

  if (!runtime.approved || !runtime.durableBindingPresent || !normalizedBindingName) {
    return {
      durableWritesEnabled: false,
      bindingName: null,
    };
  }

  return {
    durableWritesEnabled: true,
    bindingName: normalizedBindingName,
  };
}

export type HostStateEvidenceVerificationServiceContext = {
  reviewer: HostStateEvidenceReviewerContext;
  repository: HostStateEvidenceVerificationAuditRepository;
  persistence: HostStateEvidencePersistenceCapability;
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

  if (!context.persistence.durableWritesEnabled || !context.persistence.bindingName?.trim()) {
    return {
      accepted: false,
      errors: ["Approved durable verification storage is unavailable."],
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
