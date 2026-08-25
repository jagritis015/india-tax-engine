from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.tds.deduction_eligibility import calculate_eligible_deductions


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


def test_new_regime_gets_75000_standard_deduction():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
    )

    result = calculate_eligible_deductions(
        employee,
        Decimal("1500000"),
    )

    assert result["standard_deduction"] == Decimal("75000")


def test_old_regime_gets_50000_standard_deduction():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
    )

    result = calculate_eligible_deductions(
        employee,
        Decimal("1500000"),
    )

    assert result["standard_deduction"] == Decimal("50000")


def test_professional_tax_not_deductible_under_new_regime():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        professional_tax_paid=Decimal("2400"),
    )

    result = calculate_eligible_deductions(
        employee,
        Decimal("1500000"),
    )

    assert result["professional_tax"] == Decimal("0")


def test_professional_tax_deductible_under_old_regime():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        professional_tax_paid=Decimal("2400"),
    )

    result = calculate_eligible_deductions(
        employee,
        Decimal("1500000"),
    )

    assert result["professional_tax"] == Decimal("2400")


def test_section_123_not_allowed_under_new_regime():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        deduction_80c=Decimal("150000"),
    )

    result = calculate_eligible_deductions(
        employee,
        Decimal("1500000"),
    )

    assert result["deduction_123"] == Decimal("0")


def test_section_123_allowed_under_old_regime_up_to_150000():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        deduction_80c=Decimal("200000"),
    )

    result = calculate_eligible_deductions(
        employee,
        Decimal("1500000"),
    )

    assert result["deduction_123"] == Decimal("150000")
