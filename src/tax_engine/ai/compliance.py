from typing import Any

from pydantic import BaseModel, Field

from tax_engine.ai.tools import calculate_payroll_tool
from tax_engine.payroll.employee import EmployeePayrollInput


class ComplianceIssue(BaseModel):
    component: str
    severity: str
    code: str
    message: str
    action_required: str | None = None


class EmployeeComplianceResult(BaseModel):
    employee_id: str
    employee_name: str
    payroll_status: str

    ready_for_payroll: bool

    tds_status: str
    pf_status: str
    pt_status: str

    issues: list[ComplianceIssue] = Field(default_factory=list)

    payroll_summary: dict[str, Any]


def _canonical_status(value: Any, default: str = "CALCULATED") -> str:
    """
    Normalize engine status values at the AI/compliance boundary.

    Deterministic engine modules may expose Enum values while external
    consumers receive stable string contracts.
    """
    if value is None:
        return default

    enum_value = getattr(value, "value", None)
    if enum_value is not None:
        return str(enum_value).upper()

    text = str(value).upper()

    # Defensive normalization for Enum-like string representations.
    if "." in text:
        candidate = text.rsplit(".", 1)[-1]
        if candidate in {"CALCULATED", "REVIEW_REQUIRED", "BLOCKED"}:
            return candidate

    return text


def evaluate_employee_compliance(
    employee: EmployeePayrollInput,
) -> EmployeeComplianceResult:
    """
    Translate deterministic payroll output into an
    employer-facing compliance decision.

    This function does not calculate statutory amounts.
    """

    tool_result = calculate_payroll_tool(employee)

    issues: list[ComplianceIssue] = []

    tds_breakdown = tool_result.breakdowns.get("tds") or {}
    pf_breakdown = tool_result.breakdowns.get("pf") or {}
    pt_breakdown = (
        tool_result.breakdowns.get("professional_tax") or {}
    )

    tds_status = _canonical_status(
        tds_breakdown.get("status"),
        "CALCULATED",
    )

    if pf_breakdown is None:
        pf_status = "REVIEW_REQUIRED"
    else:
        pf_status = (
            "REVIEW_REQUIRED"
            if tool_result.status == "REVIEW_REQUIRED"
            and tool_result.summary.get("employee_pf") is None
            else "CALCULATED"
        )

    pt_status = _canonical_status(
        pt_breakdown.get("status"),
        "CALCULATED",
    )

    if tds_status == "REVIEW_REQUIRED":
        issues.append(
            ComplianceIssue(
                component="TDS",
                severity="HIGH",
                code="TDS_REVIEW_REQUIRED",
                message="Salary TDS requires review.",
                action_required=(
                    "Resolve employee declaration or evidence issues."
                ),
            )
        )

    if pf_status == "REVIEW_REQUIRED":
        issues.append(
            ComplianceIssue(
                component="PF",
                severity="HIGH",
                code="PF_REVIEW_REQUIRED",
                message="PF treatment requires review.",
                action_required=(
                    "Resolve PF applicability or wage inputs."
                ),
            )
        )

    if pt_status == "REVIEW_REQUIRED":
        reason = pt_breakdown.get(
            "review_reason",
            "Professional Tax rule requires review.",
        )

        issues.append(
            ComplianceIssue(
                component="PT",
                severity="HIGH",
                code="PT_REVIEW_REQUIRED",
                message=str(reason),
                action_required=(
                    "Verify the applicable state PT rule."
                ),
            )
        )

    ready_for_payroll = (
        tool_result.status == "CALCULATED"
        and not issues
    )

    return EmployeeComplianceResult(
        employee_id=str(
            tool_result.summary["employee_id"]
        ),
        employee_name=str(
            tool_result.summary["employee_name"]
        ),
        payroll_status=tool_result.status,
        ready_for_payroll=ready_for_payroll,
        tds_status=str(tds_status),
        pf_status=str(pf_status),
        pt_status=str(pt_status),
        issues=issues,
        payroll_summary=tool_result.summary,
    )
