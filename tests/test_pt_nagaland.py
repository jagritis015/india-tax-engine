from datetime import date
from decimal import Decimal

import pytest

from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    TaxRegime,
)
from tax_engine.services.payroll_service import (
    run_employee_payroll,
)


def employee(salary: str) -> EmployeePayrollInput:
    return EmployeePayrollInput(
        employee_id="NAG001",
        employee_name="Nagaland PT Test",
        pan="ABCDE1234F",
        date_of_joining=date(2026, 4, 1),
        work_state="Nagaland",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        basic_salary=Decimal(salary),
        pf_applicable=False,
        payroll_month=8,
        tax_year="2026-27",
    )


@pytest.mark.parametrize(
    ("salary", "expected"),
    [
        ("3999", "0"),
        ("4000", "0"),
        ("4000.01", "35"),
        ("5000", "35"),
        ("5000.01", "75"),
        ("7000", "75"),
        ("7000.01", "110"),
        ("9000", "110"),
        ("9000.01", "180"),
        ("12000", "180"),
        ("12000.01", "208"),
        ("50000", "208"),
    ],
)
def test_nagaland_pt_boundaries(
    salary,
    expected,
):
    result = run_employee_payroll(
        employee(salary)
    )

    assert result["professional_tax"] == Decimal(expected)
    assert result["status"] != "REVIEW_REQUIRED"
    assert result["pt_breakdown"]["review_reason"] is None
