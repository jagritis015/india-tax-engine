from datetime import date
from decimal import Decimal

import pytest

from tax_engine.ai.monthly_compliance import (
    evaluate_monthly_compliance,
)
from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    TaxRegime,
)


def employee(
    employee_id: str,
    *,
    state: str = "Gujarat",
    payroll_month: int = 4,
    tax_year: str = "2026-27",
) -> EmployeePayrollInput:
    return EmployeePayrollInput(
        employee_id=employee_id,
        employee_name=f"Employee {employee_id}",
        pan="ABCDE1234F",
        date_of_joining=date(2026, 4, 1),
        work_state=state,
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        basic_salary=Decimal("50000"),
        pf_applicable=False,
        payroll_month=payroll_month,
        tax_year=tax_year,
    )


def test_fully_ready_month_can_be_approved():
    result = evaluate_monthly_compliance(
        [
            employee("E001"),
            employee("E002"),
        ]
    )

    assert result.employees_processed == 2
    assert result.ready_for_payroll == 2
    assert result.review_required == 0
    assert result.blocked == 0
    assert result.readiness_percentage == Decimal("100.00")
    assert result.payroll_can_be_approved is True


def test_one_unverified_state_blocks_monthly_approval():
    result = evaluate_monthly_compliance(
        [
            employee("E001"),
            employee("E002", state="Tamil Nadu"),
        ]
    )

    assert result.employees_processed == 2
    assert result.ready_for_payroll == 1
    assert result.review_required == 1
    assert result.readiness_percentage == Decimal("50.00")
    assert result.payroll_can_be_approved is False

    assert any(
        issue.code == "PT_REVIEW_REQUIRED"
        for issue in result.issues
    )


def test_monthly_totals_are_engine_derived():
    result = evaluate_monthly_compliance(
        [
            employee("E001"),
            employee("E002"),
        ]
    )

    employee_results = result.employee_results

    expected_gross = sum(
        Decimal(str(r.payroll_summary["gross_salary"]))
        for r in employee_results
    )

    expected_tds = sum(
        Decimal(str(r.payroll_summary["tds"] or 0))
        for r in employee_results
    )

    expected_pt = sum(
        Decimal(
            str(r.payroll_summary["professional_tax"] or 0)
        )
        for r in employee_results
    )

    assert result.totals.gross_salary == expected_gross
    assert result.totals.tds == expected_tds
    assert result.totals.professional_tax == expected_pt


def test_mixed_payroll_months_are_rejected():
    with pytest.raises(
        ValueError,
        match="same payroll month",
    ):
        evaluate_monthly_compliance(
            [
                employee("E001", payroll_month=4),
                employee("E002", payroll_month=5),
            ]
        )


def test_empty_month_is_rejected():
    with pytest.raises(
        ValueError,
        match="At least one employee",
    ):
        evaluate_monthly_compliance([])
