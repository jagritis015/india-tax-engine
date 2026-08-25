from decimal import Decimal

import pytest
from pydantic import ValidationError

from tax_engine.payroll.payroll_result import PayrollResult


def test_calculated_payroll_result_is_valid():
    result = PayrollResult(
        status="CALCULATED",
        employee_id="EMP001",
        employee_name="Test Employee",
        tax_year="2026-27",
        payroll_month=4,
        gross_salary=Decimal("100000"),
        tds=Decimal("10000"),
        employee_pf=Decimal("1800"),
        professional_tax=Decimal("200"),
        total_deductions=Decimal("12000"),
        net_salary=Decimal("88000"),
    )

    assert result.status == "CALCULATED"
    assert result.net_salary == Decimal("88000")


def test_review_required_can_withhold_final_payroll_values():
    result = PayrollResult(
        status="REVIEW_REQUIRED",
        employee_id="EMP002",
        employee_name="Review Employee",
        tax_year="2026-27",
        payroll_month=4,
        gross_salary=Decimal("100000"),
        tds=Decimal("10000"),
        employee_pf=None,
        professional_tax=Decimal("200"),
        total_deductions=None,
        net_salary=None,
    )

    assert result.status == "REVIEW_REQUIRED"
    assert result.net_salary is None
    assert result.total_deductions is None


def test_invalid_payroll_status_is_rejected():
    with pytest.raises(ValidationError):
        PayrollResult(
            status="UNKNOWN",
            employee_id="EMP003",
            employee_name="Invalid Employee",
            tax_year="2026-27",
            payroll_month=4,
            gross_salary=Decimal("100000"),
        )
