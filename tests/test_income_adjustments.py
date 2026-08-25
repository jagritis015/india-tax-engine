from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    TaxRegime,
)
from tax_engine.tds.income_adjustments import (
    calculate_declared_income_adjustments,
)


def make_employee(**overrides):
    data = {
        "employee_id": "EMP001",
        "employee_name": "Test Employee",
        "date_of_joining": date(2026, 4, 1),
        "work_state": "Karnataka",
        "payroll_month": 8,
        "tax_year": "2026-27",
        "tax_regime": TaxRegime.NEW,
        "regime_declared": True,
    }

    data.update(overrides)

    return EmployeePayrollInput(**data)


def test_declared_other_income_is_considered():
    employee = make_employee(
        other_income_declared=Decimal("100000"),
        other_income_declared_by_employee=True,
    )

    result = calculate_declared_income_adjustments(employee)

    assert result["other_income"] == Decimal("100000")


def test_positive_house_property_income_is_considered_new_regime():
    employee = make_employee(
        house_property_income_or_loss=Decimal("100000"),
        house_property_evidence_verified=True,
    )

    result = calculate_declared_income_adjustments(employee)

    assert (
        result["house_property_adjustment"]
        == Decimal("100000")
    )


def test_new_regime_house_property_loss_does_not_reduce_salary():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        house_property_income_or_loss=Decimal("-150000"),
        house_property_evidence_verified=True,
    )

    result = calculate_declared_income_adjustments(employee)

    assert result["house_property_adjustment"] == Decimal("0")
    assert (
        result["house_property_loss_disallowed"]
        == Decimal("150000")
    )


def test_old_regime_house_property_loss_allowed_up_to_2_lakh():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        house_property_income_or_loss=Decimal("-250000"),
        house_property_evidence_verified=True,
    )

    result = calculate_declared_income_adjustments(employee)

    assert (
        result["house_property_adjustment"]
        == Decimal("-200000")
    )

    assert (
        result["house_property_loss_disallowed"]
        == Decimal("50000")
    )


def test_old_regime_house_property_loss_below_cap():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        house_property_income_or_loss=Decimal("-100000"),
        house_property_evidence_verified=True,
    )

    result = calculate_declared_income_adjustments(employee)

    assert (
        result["house_property_adjustment"]
        == Decimal("-100000")
    )


def test_unverified_house_property_requires_review():
    employee = make_employee(
        house_property_income_or_loss=Decimal("-100000"),
        house_property_evidence_verified=False,
    )

    result = calculate_declared_income_adjustments(employee)

    assert result["house_property_adjustment"] == Decimal("0")
    assert result["review_required"] is True


def test_previous_employer_without_verification_requires_review():
    employee = make_employee(
        previous_employer_taxable_salary=Decimal("500000"),
        previous_employer_tds=Decimal("25000"),
        previous_employer_details_verified=False,
    )

    result = calculate_declared_income_adjustments(employee)

    assert result["review_required"] is True
