from datetime import date
from decimal import Decimal

from tax_engine.ai.monthly_compliance import (
    evaluate_monthly_compliance,
)
from tax_engine.ai.monthly_dashboard import (
    build_monthly_dashboard_data,
)
from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    TaxRegime,
)


def employee(
    employee_id: str,
    *,
    state: str = "Gujarat",
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
        payroll_month=4,
        tax_year="2026-27",
    )


def test_dashboard_ready_month():
    monthly = evaluate_monthly_compliance(
        [
            employee("E001"),
            employee("E002"),
        ]
    )

    dashboard = build_monthly_dashboard_data(
        monthly
    )

    assert dashboard["employees_processed"] == 2
    assert dashboard["ready_for_payroll"] == 2
    assert dashboard["review_required"] == 0
    assert dashboard["payroll_can_be_approved"] is True
    assert dashboard["blocking_employee_ids"] == []


def test_dashboard_surfaces_pt_exception():
    monthly = evaluate_monthly_compliance(
        [
            employee("E001"),
            employee("E002", state="Tamil Nadu"),
        ]
    )

    dashboard = build_monthly_dashboard_data(
        monthly
    )

    assert dashboard["payroll_can_be_approved"] is False
    assert dashboard["exceptions"]["pt"] == 1
    assert dashboard["blocking_employee_ids"] == ["E002"]


def test_dashboard_totals_match_monthly_run():
    monthly = evaluate_monthly_compliance(
        [
            employee("E001"),
            employee("E002"),
        ]
    )

    dashboard = build_monthly_dashboard_data(
        monthly
    )

    assert (
        dashboard["totals"]["gross_salary"]
        == monthly.totals.gross_salary
    )

    assert (
        dashboard["totals"]["tds"]
        == monthly.totals.tds
    )

    assert (
        dashboard["totals"]["professional_tax"]
        == monthly.totals.professional_tax
    )
