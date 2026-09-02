from datetime import date
from decimal import Decimal

from tax_engine.ai.exception_intelligence import (
    build_exception_intelligence,
    evaluate_monthly_exceptions,
)
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


def test_ready_month_has_no_exception_queues():
    result = evaluate_monthly_exceptions(
        [
            employee("E001"),
            employee("E002"),
        ]
    )

    assert result.payroll_can_be_approved is True
    assert result.total_exceptions == 0
    assert result.affected_employees == 0
    assert result.queues == []


def test_pt_review_cases_are_grouped():
    result = evaluate_monthly_exceptions(
        [
            employee("E001", state="Tamil Nadu"),
            employee("E002", state="Tamil Nadu"),
        ]
    )

    assert result.payroll_can_be_approved is False
    assert result.pt_exceptions == 2
    assert result.affected_employees == 2

    queue = next(
        q for q in result.queues
        if q.issue_code == "PT_REVIEW_REQUIRED"
    )

    assert queue.component == "PT"
    assert queue.affected_count == 2
    assert queue.blocks_payroll is True

    ids = {
        employee.employee_id
        for employee in queue.employees
    }

    assert ids == {"E001", "E002"}


def test_verified_and_unverified_employees_are_separated():
    monthly = evaluate_monthly_compliance(
        [
            employee("E001"),
            employee("E002", state="Tamil Nadu"),
        ]
    )

    result = build_exception_intelligence(
        monthly
    )

    assert result.affected_employees == 1
    assert result.pt_exceptions == 1

    queue = result.queues[0]

    assert queue.affected_count == 1
    assert queue.employees[0].employee_id == "E002"


def test_exception_layer_does_not_change_monthly_approval():
    monthly = evaluate_monthly_compliance(
        [
            employee("E001"),
            employee("E002", state="Tamil Nadu"),
        ]
    )

    result = build_exception_intelligence(
        monthly
    )

    assert (
        result.payroll_can_be_approved
        == monthly.payroll_can_be_approved
    )


def test_exception_queue_has_next_action():
    result = evaluate_monthly_exceptions(
        [
            employee("E001", state="Tamil Nadu"),
        ]
    )

    assert result.queues
    assert result.queues[0].next_action
