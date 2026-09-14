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

export type HostStateEvidencePersistenceReadiness = {
  ready: boolean;
  reason:
    | "STORAGE_NOT_APPROVED"
    | "DURABLE_BINDING_ABSENT"
    | "BINDING_NAME_MISSING"
    | "READY";
  bindingName: string | null;
};

export type HostStateEvidencePersistenceEnvironment = {
  HOST_STATE_EVIDENCE_STORAGE_APPROVED?: string;
  HOST_STATE_EVIDENCE_DURABLE_BINDING_PRESENT?: string;
  HOST_STATE_EVIDENCE_STORAGE_BINDING?: string;
};

function isExplicitlyEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function resolveHostStateEvidencePersistenceRuntimeState(
  environment: HostStateEvidencePersistenceEnvironment,
): HostStateEvidencePersistenceRuntimeState {
  return {
    approved: isExplicitlyEnabled(environment.HOST_STATE_EVIDENCE_STORAGE_APPROVED),
    durableBindingPresent: isExplicitlyEnabled(
      environment.HOST_STATE_EVIDENCE_DURABLE_BINDING_PRESENT,
    ),
    bindingName: environment.HOST_STATE_EVIDENCE_STORAGE_BINDING ?? null,
  };
}

export function inspectHostStateEvidencePersistenceReadiness(
  runtime: HostStateEvidencePersistenceRuntimeState,
): HostStateEvidencePersistenceReadiness {
  const normalizedBindingName = runtime.bindingName?.trim() || null;

  if (!runtime.approved) {
    return {
      ready: false,
      reason: "STORAGE_NOT_APPROVED",
      bindingName: null,
    };
  }

  if (!runtime.durableBindingPresent) {
    return {
      ready: false,
      reason: "DURABLE_BINDING_ABSENT",
      bindingName: null,
    };
  }

  if (!normalizedBindingName) {
    return {
      ready: false,
      reason: "BINDING_NAME_MISSING",
      bindingName: null,
    };
  }

  return {
    ready: true,
    reason: "READY",
    bindingName: normalizedBindingName,
  };
}

export function resolveHostStateEvidencePersistenceCapability(
  runtime: HostStateEvidencePersistenceRuntimeState,
): HostStateEvidencePersistenceCapability {
  const readiness = inspectHostStateEvidencePersistenceReadiness(runtime);

  if (!readiness.ready) {
    return {
      durableWritesEnabled: false,
      bindingName: null,
    };
  }

  return {
    durableWritesEnabled: true,
    bindingName: readiness.bindingName,
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
