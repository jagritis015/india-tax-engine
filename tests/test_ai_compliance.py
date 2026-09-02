from datetime import date
from decimal import Decimal

from tax_engine.ai.compliance import evaluate_employee_compliance
from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime


def employee_for_state(state: str) -> EmployeePayrollInput:
    return EmployeePayrollInput(
        employee_id="CMP001",
        employee_name="Compliance Test",
        pan="ABCDE1234F",
        date_of_joining=date(2026, 4, 1),
        work_state=state,
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        basic_salary=Decimal("50000"),
        pf_applicable=False,
        payroll_month=4,
        tax_year="2026-27",
    )


def test_verified_employee_can_be_ready_for_payroll():
    result = evaluate_employee_compliance(
        employee_for_state("Gujarat")
    )

    assert result.payroll_status == "CALCULATED"
    assert result.ready_for_payroll is True
    assert result.issues == []


def test_unverified_pt_blocks_payroll_readiness():
    result = evaluate_employee_compliance(
        employee_for_state("Tamil Nadu")
    )

    assert result.payroll_status == "REVIEW_REQUIRED"
    assert result.ready_for_payroll is False
    assert result.pt_status == "REVIEW_REQUIRED"

    assert any(
        issue.code == "PT_REVIEW_REQUIRED"
        for issue in result.issues
    )


def test_compliance_layer_does_not_invent_net_salary():
    result = evaluate_employee_compliance(
        employee_for_state("Tamil Nadu")
    )

    assert result.payroll_summary["net_salary"] is None
    assert result.payroll_summary["total_deductions"] is None
