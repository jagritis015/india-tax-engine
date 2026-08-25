from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput
from tax_engine.tds.salary_projection import (
    current_month_gross,
    months_remaining_including_current,
    project_tax_year_salary,
)


def make_employee(**overrides):
    data = {
        "employee_id": "EMP001",
        "employee_name": "Test Employee",
        "date_of_joining": date(2026, 4, 1),
        "work_state": "Karnataka",
        "payroll_month": 8,
        "tax_year": "2026-27",
        "basic_salary": Decimal("50000"),
        "hra": Decimal("20000"),
        "special_allowance": Decimal("30000"),
    }

    data.update(overrides)
    return EmployeePayrollInput(**data)


def test_current_month_gross():
    employee = make_employee()

    assert current_month_gross(employee) == Decimal("100000")


def test_august_has_eight_months_remaining_including_current():
    assert months_remaining_including_current(8) == 8


def test_march_has_one_month_remaining():
    assert months_remaining_including_current(3) == 1


def test_salary_projection():
    employee = make_employee(
        taxable_salary_ytd=Decimal("400000"),
    )

    assert project_tax_year_salary(employee) == Decimal("1200000")


def test_previous_employer_salary_is_included():
    employee = make_employee(
        taxable_salary_ytd=Decimal("400000"),
        previous_employer_taxable_salary=Decimal("300000"),
    )

    assert project_tax_year_salary(employee) == Decimal("1500000")


def test_future_bonus_is_included_in_projection():
    employee = make_employee(
        taxable_salary_ytd=Decimal("400000"),
        projected_future_bonus=Decimal("200000"),
    )

    assert project_tax_year_salary(
        employee
    ) == Decimal("1400000")


def test_future_variable_pay_is_included_in_projection():
    employee = make_employee(
        taxable_salary_ytd=Decimal("400000"),
        projected_future_variable_pay=Decimal("100000"),
    )

    assert project_tax_year_salary(
        employee
    ) == Decimal("1300000")
