from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime


def test_valid_employee_payroll_is_accepted():
    employee = EmployeePayrollInput(
        employee_id="EMP001",
        employee_name="Test Employee",
        pan="ABCDE1234F",
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        basic_salary=Decimal("50000"),
        hra=Decimal("20000"),
        special_allowance=Decimal("30000"),
        taxable_salary_ytd=Decimal("400000"),
        tds_deducted_ytd=Decimal("10000"),
        pf_applicable=True,
        pf_wages=Decimal("50000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert employee.employee_id == "EMP001"
    assert employee.tax_regime == TaxRegime.NEW
    assert employee.basic_salary == Decimal("50000")
    assert employee.work_state == "Karnataka"


def test_invalid_payroll_month_is_rejected():
    with pytest.raises(ValidationError):
        EmployeePayrollInput(
            employee_id="EMP002",
            employee_name="Test Employee",
            date_of_joining=date(2026, 4, 1),
            work_state="Karnataka",
            basic_salary=Decimal("50000"),
            payroll_month=13,
            tax_year="2026-27",
        )


def test_negative_salary_is_rejected():
    with pytest.raises(ValidationError):
        EmployeePayrollInput(
            employee_id="EMP003",
            employee_name="Test Employee",
            date_of_joining=date(2026, 4, 1),
            work_state="Karnataka",
            basic_salary=Decimal("-50000"),
            payroll_month=8,
            tax_year="2026-27",
        )
