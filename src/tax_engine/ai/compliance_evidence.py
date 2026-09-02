from typing import Any

from pydantic import BaseModel, Field

from tax_engine.ai.compliance import EmployeeComplianceResult


class EvidenceRequirement(BaseModel):
    field: str
    label: str
    status: str
    required_action: str


class ComplianceEvidenceCase(BaseModel):
    employee_id: str
    employee_name: str

    component: str
    status: str
    issue_code: str

    reason: str
    assumption_policy: str

    missing_evidence: list[EvidenceRequirement] = Field(
        default_factory=list
    )

    next_action: str
    engine_amount_withheld: bool

    context: dict[str, Any] = Field(default_factory=dict)


def _pt_evidence_requirements(
    pt_breakdown: dict[str, Any],
) -> list[EvidenceRequirement]:
    reason = str(
        pt_breakdown.get("review_reason") or ""
    ).lower()

    requirements: list[EvidenceRequirement] = []

    if "half-year context missing" in reason:
        requirements.extend(
            [
                EvidenceRequirement(
                    field="pt_half_year_salary_or_wages",
                    label="Half-year salary / wages",
                    status="MISSING",
                    required_action=(
                        "Provide or derive salary/wages for the "
                        "applicable Professional Tax half-year."
                    ),
                ),
                EvidenceRequirement(
                    field="pt_days_employed_in_half_year",
                    label="Days employed in half-year",
                    status="MISSING",
                    required_action=(
                        "Provide or derive aggregate employment "
                        "days in the applicable half-year."
                    ),
                ),
                EvidenceRequirement(
                    field="pt_already_deducted_for_half_year",
                    label="PT already deducted in half-year",
                    status="REQUIRED_FOR_RECONCILIATION",
                    required_action=(
                        "Confirm Professional Tax already deducted "
                        "during the current half-year."
                    ),
                ),
            ]
        )

    elif "rule not verified" in reason:
        requirements.append(
            EvidenceRequirement(
                field="verified_pt_rule",
                label="Verified Professional Tax rule",
                status="MISSING",
                required_action=(
                    "Verify jurisdiction applicability and rule "
                    "provenance before calculating Professional Tax."
                ),
            )
        )

    return requirements


def build_employee_evidence_cases(
    employee_result: EmployeeComplianceResult,
) -> list[ComplianceEvidenceCase]:
    """
    Convert deterministic compliance exceptions into actionable
    evidence cases.

    This layer never calculates statutory amounts and never changes
    the employee's compliance status.
    """

    cases: list[ComplianceEvidenceCase] = []

    pt_breakdown = (
        employee_result.payroll_summary.get("pt_breakdown")
        if isinstance(employee_result.payroll_summary, dict)
        else None
    )

    # The AI tool summary may not expose PT breakdown directly.
    # Fall back to issue information when necessary.
    if not isinstance(pt_breakdown, dict):
        pt_breakdown = {}

    for issue in employee_result.issues:
        missing_evidence: list[EvidenceRequirement] = []

        context: dict[str, Any] = {
            "payroll_status": employee_result.payroll_status,
            "tds_status": employee_result.tds_status,
            "pf_status": employee_result.pf_status,
            "pt_status": employee_result.pt_status,
        }

        if issue.component == "PT":
            missing_evidence = _pt_evidence_requirements(
                pt_breakdown
            )

            # If the payroll summary does not carry the detailed
            # breakdown, derive only from the deterministic issue text.
            if not missing_evidence:
                reason_text = issue.message.lower()

                if "half-year context missing" in reason_text:
                    missing_evidence = _pt_evidence_requirements(
                        {
                            "review_reason": (
                                "half-year context missing"
                            )
                        }
                    )

                elif "rule not verified" in reason_text:
                    missing_evidence = _pt_evidence_requirements(
                        {
                            "review_reason": (
                                "rule not verified"
                            )
                        }
                    )

        cases.append(
            ComplianceEvidenceCase(
                employee_id=employee_result.employee_id,
                employee_name=employee_result.employee_name,
                component=issue.component,
                status="ACTION_REQUIRED",
                issue_code=issue.code,
                reason=issue.message,
                assumption_policy=(
                    "No statutory amount is estimated when "
                    "required evidence or rule verification is missing."
                ),
                missing_evidence=missing_evidence,
                next_action=(
                    issue.action_required
                    or "Resolve the underlying compliance evidence."
                ),
                engine_amount_withheld=(
                    employee_result.payroll_status
                    == "REVIEW_REQUIRED"
                ),
                context=context,
            )
        )

    return cases
