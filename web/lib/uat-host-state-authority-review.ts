export type HostStateAuthorityReviewStatus = "BLOCKED" | "REVIEW_REQUIRED" | "APPROVED";

export type HostStateAuthorityReview = {
  status: HostStateAuthorityReviewStatus;
  candidateState: string | null;
  authoritativeState: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvalReference: string | null;
  stateTaxAssessmentAllowed: false;
};

export function assessHostStateAuthorityReview(input: {
  allRequiredEvidenceVerified: boolean;
  candidateState?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  approvalReference?: string | null;
}): HostStateAuthorityReview {
  const candidateState = input.candidateState?.trim() || null;
  const reviewedBy = input.reviewedBy?.trim() || null;
  const reviewedAt = input.reviewedAt?.trim() || null;
  const approvalReference = input.approvalReference?.trim() || null;

  if (!input.allRequiredEvidenceVerified || !candidateState) {
    return { status: "BLOCKED", candidateState, authoritativeState: null, reviewedBy, reviewedAt, approvalReference, stateTaxAssessmentAllowed: false };
  }

  const hasCompleteApprovalProvenance = Boolean(reviewedBy && reviewedAt && approvalReference);
  return {
    status: hasCompleteApprovalProvenance ? "APPROVED" : "REVIEW_REQUIRED",
    candidateState,
    authoritativeState: hasCompleteApprovalProvenance ? candidateState : null,
    reviewedBy,
    reviewedAt,
    approvalReference,
    stateTaxAssessmentAllowed: false,
  };
}
