from tax_engine.ai.compliance import (
    ComplianceIssue,
    EmployeeComplianceResult,
)
from tax_engine.ai.compliance_evidence import (
    build_employee_evidence_cases,
)


def result_with_pt_issue(
    message: str,
) -> EmployeeComplianceResult:
    return EmployeeComplianceResult(
        employee_id="EMP004",
        employee_name="Ananya Rao",
        payroll_status="REVIEW_REQUIRED",
        ready_for_payroll=False,
        tds_status="CALCULATED",
        pf_status="CALCULATED",
        pt_status="REVIEW_REQUIRED",
        issues=[
            ComplianceIssue(
                component="PT",
                severity="HIGH",
                code="PT_REVIEW_REQUIRED",
                message=message,
                action_required=(
                    "Resolve Professional Tax requirements."
                ),
            )
        ],
        payroll_summary={},
    )


def test_tamil_nadu_missing_context_becomes_evidence_case():
    result = result_with_pt_issue(
        "Tamil Nadu Professional Tax half-year context missing"
    )

    cases = build_employee_evidence_cases(result)

    assert len(cases) == 1

    case = cases[0]

    assert case.status == "ACTION_REQUIRED"
    assert case.engine_amount_withheld is True

    fields = {
        requirement.field
        for requirement in case.missing_evidence
    }

    assert "pt_half_year_salary_or_wages" in fields
    assert "pt_days_employed_in_half_year" in fields
    assert "pt_already_deducted_for_half_year" in fields


def test_unverified_pt_rule_becomes_rule_evidence_case():
    result = result_with_pt_issue(
        "Professional Tax rule not verified for Delhi "
        "for TY 2026-27"
    )

    cases = build_employee_evidence_cases(result)

    fields = {
        requirement.field
        for requirement in cases[0].missing_evidence
    }

    assert fields == {"verified_pt_rule"}


def test_evidence_layer_never_changes_compliance_status():
    result = result_with_pt_issue(
        "Tamil Nadu Professional Tax half-year context missing"
    )

    original_status = result.payroll_status

    build_employee_evidence_cases(result)

    assert result.payroll_status == original_status


def test_evidence_case_declares_no_estimation_policy():
    result = result_with_pt_issue(
        "Professional Tax rule not verified for Delhi "
        "for TY 2026-27"
    )

    case = build_employee_evidence_cases(result)[0]

    assert "No statutory amount is estimated" in (
        case.assumption_policy
    )


def test_ready_employee_produces_no_evidence_cases():
    result = EmployeeComplianceResult(
        employee_id="EMP001",
        employee_name="Arjun Sharma",
        payroll_status="CALCULATED",
        ready_for_payroll=True,
        tds_status="CALCULATED",
        pf_status="CALCULATED",
        pt_status="CALCULATED",
        issues=[],
        payroll_summary={},
    )

    assert build_employee_evidence_cases(result) == []
