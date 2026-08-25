from decimal import Decimal

import pytest
from pydantic import ValidationError

from tax_engine.professional_tax.half_year_context import (
    PTHalfYearContext,
    is_tamil_nadu_pt_deduction_month,
    tamil_nadu_half_year_number,
)


def test_april_to_september_is_first_half():
    for month in [4, 5, 6, 7, 8, 9]:
        assert tamil_nadu_half_year_number(month) == 1


def test_october_to_march_is_second_half():
    for month in [10, 11, 12, 1, 2, 3]:
        assert tamil_nadu_half_year_number(month) == 2


def test_august_is_pt_deduction_month():
    assert is_tamil_nadu_pt_deduction_month(8) is True


def test_january_is_pt_deduction_month():
    assert is_tamil_nadu_pt_deduction_month(1) is True


def test_other_month_is_not_pt_deduction_month():
    assert is_tamil_nadu_pt_deduction_month(7) is False


def test_half_year_context_accepts_valid_values():
    context = PTHalfYearContext(
        half_year_salary_or_wages=Decimal("1200000"),
        days_employed_in_half_year=150,
        pt_already_deducted_for_half_year=Decimal("0"),
    )

    assert (
        context.half_year_salary_or_wages
        == Decimal("1200000")
    )


def test_negative_half_year_salary_rejected():
    with pytest.raises(ValidationError):
        PTHalfYearContext(
            half_year_salary_or_wages=Decimal("-1"),
            days_employed_in_half_year=100,
        )
