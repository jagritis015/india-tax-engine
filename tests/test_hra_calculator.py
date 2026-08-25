from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.tds.hra_calculator import calculate_hra_exemption


def make_employee(**overrides):
    data = {
        "employee_id": "EMP001",
        "employee_name": "Test Employee",
        "date_of_joining": date(2026, 4, 1),
        "work_state": "Karnataka",
        "payroll_month": 8,
        "tax_year": "2026-27",
    }

    data.update(overrides)
    return EmployeePayrollInput(**data)


def test_hra_exemption_old_regime_bengaluru():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        annual_rent_paid=Decimal("360000"),
        hra_location="Bengaluru",
    )

    result = calculate_hra_exemption(
        employee=employee,
        projected_basic_salary=Decimal("600000"),
        projected_da=Decimal("0"),
        projected_hra=Decimal("300000"),
    )

    assert result == Decimal("300000")


def test_hra_exemption_old_regime_other_city():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        annual_rent_paid=Decimal("300000"),
        hra_location="Jaipur",
    )

    result = calculate_hra_exemption(
        employee=employee,
        projected_basic_salary=Decimal("600000"),
        projected_da=Decimal("0"),
        projected_hra=Decimal("300000"),
    )

    assert result == Decimal("240000")


def test_no_hra_exemption_under_new_regime():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        annual_rent_paid=Decimal("360000"),
        hra_location="Bengaluru",
    )

    result = calculate_hra_exemption(
        employee=employee,
        projected_basic_salary=Decimal("600000"),
        projected_da=Decimal("0"),
        projected_hra=Decimal("300000"),
    )

    assert result == Decimal("0")


def test_no_rent_means_no_hra_exemption():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        annual_rent_paid=Decimal("0"),
        hra_location="Delhi",
    )

    result = calculate_hra_exemption(
        employee=employee,
        projected_basic_salary=Decimal("600000"),
        projected_da=Decimal("0"),
        projected_hra=Decimal("300000"),
    )

    assert result == Decimal("0")
