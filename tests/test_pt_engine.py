from decimal import Decimal

import pytest

from tax_engine.professional_tax.models import PTStatus
from tax_engine.professional_tax.pt_engine import (
    calculate_professional_tax,
)


def test_karnataka_normal_month():
    result = calculate_professional_tax(
        work_state="Karnataka",
        monthly_salary_or_wages=Decimal("50000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.status == PTStatus.CALCULATED
    assert result.professional_tax == Decimal("200")


def test_karnataka_february():
    result = calculate_professional_tax(
        work_state="Karnataka",
        monthly_salary_or_wages=Decimal("50000"),
        payroll_month=2,
        tax_year="2026-27",
    )

    assert result.professional_tax == Decimal("300")


def test_karnataka_below_threshold():
    result = calculate_professional_tax(
        work_state="Karnataka",
        monthly_salary_or_wages=Decimal("24999"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.professional_tax == Decimal("0")


def test_telangana_below_threshold():
    result = calculate_professional_tax(
        work_state="Telangana",
        monthly_salary_or_wages=Decimal("15000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.professional_tax == Decimal("0")


def test_telangana_middle_slab():
    result = calculate_professional_tax(
        work_state="Telangana",
        monthly_salary_or_wages=Decimal("18000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.professional_tax == Decimal("150")


def test_telangana_top_slab():
    result = calculate_professional_tax(
        work_state="Telangana",
        monthly_salary_or_wages=Decimal("50000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.professional_tax == Decimal("200")


def test_gujarat_at_12000():
    result = calculate_professional_tax(
        work_state="Gujarat",
        monthly_salary_or_wages=Decimal("12000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.professional_tax == Decimal("0")


def test_gujarat_above_12000():
    result = calculate_professional_tax(
        work_state="Gujarat",
        monthly_salary_or_wages=Decimal("12001"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.professional_tax == Decimal("200")


def test_unconfigured_maharashtra_requires_review():
    result = calculate_professional_tax(
        work_state="Maharashtra",
        monthly_salary_or_wages=Decimal("100000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.status == PTStatus.REVIEW_REQUIRED


def test_unknown_location_rejected():
    with pytest.raises(ValueError):
        calculate_professional_tax(
            work_state="Made Up State",
            monthly_salary_or_wages=Decimal("50000"),
            payroll_month=8,
            tax_year="2026-27",
        )


from tax_engine.payroll.employee import Sex


def test_maharashtra_male_above_10000():
    result = calculate_professional_tax(
        work_state="Maharashtra",
        monthly_salary_or_wages=Decimal("50000"),
        payroll_month=8,
        tax_year="2026-27",
        sex=Sex.MALE,
    )

    assert result.status == PTStatus.CALCULATED
    assert result.professional_tax == Decimal("200")


def test_maharashtra_female_at_25000():
    result = calculate_professional_tax(
        work_state="Maharashtra",
        monthly_salary_or_wages=Decimal("25000"),
        payroll_month=8,
        tax_year="2026-27",
        sex=Sex.FEMALE,
    )

    assert result.professional_tax == Decimal("0")


def test_maharashtra_female_above_25000():
    result = calculate_professional_tax(
        work_state="Maharashtra",
        monthly_salary_or_wages=Decimal("25001"),
        payroll_month=8,
        tax_year="2026-27",
        sex=Sex.FEMALE,
    )

    assert result.professional_tax == Decimal("200")


def test_maharashtra_february_is_300():
    result = calculate_professional_tax(
        work_state="Maharashtra",
        monthly_salary_or_wages=Decimal("50000"),
        payroll_month=2,
        tax_year="2026-27",
        sex=Sex.MALE,
    )

    assert result.professional_tax == Decimal("300")


def test_maharashtra_missing_sex_requires_review():
    result = calculate_professional_tax(
        work_state="Maharashtra",
        monthly_salary_or_wages=Decimal("50000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.status == PTStatus.REVIEW_REQUIRED
