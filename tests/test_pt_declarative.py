from decimal import Decimal

import pytest

from tax_engine.professional_tax.declarative import (
    calculate_declarative_pt,
)
from tax_engine.professional_tax.verified_schedules_2026_27 import (
    NAGALAND_2026_27,
    TAMIL_NADU_2026_27,
    TELANGANA_2026_27,
)


@pytest.mark.parametrize(
    ("salary", "expected"),
    [
        ("0", "0"),
        ("15000", "0"),
        ("15000.01", "150"),
        ("20000", "150"),
        ("20000.01", "200"),
        ("100000", "200"),
    ],
)
def test_telangana_boundaries(
    salary,
    expected,
):
    assert calculate_declarative_pt(
        rule=TELANGANA_2026_27,
        monthly_income=Decimal(salary),
    ) == Decimal(expected)


@pytest.mark.parametrize(
    ("salary", "expected"),
    [
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
    ],
)
def test_nagaland_boundaries(
    salary,
    expected,
):
    assert calculate_declarative_pt(
        rule=NAGALAND_2026_27,
        monthly_income=Decimal(salary),
    ) == Decimal(expected)


@pytest.mark.parametrize(
    ("income", "expected"),
    [
        ("21000", "0"),
        ("21000.01", "135"),
        ("30000", "135"),
        ("30000.01", "315"),
        ("45000", "315"),
        ("45000.01", "690"),
        ("60000", "690"),
        ("60000.01", "1025"),
        ("75000", "1025"),
        ("75000.01", "1250"),
    ],
)
def test_tamil_nadu_boundaries(
    income,
    expected,
):
    assert calculate_declarative_pt(
        rule=TAMIL_NADU_2026_27,
        half_year_income=Decimal(income),
        days_employed_in_period=100,
    ) == Decimal(expected)


def test_tamil_nadu_under_60_days_is_zero():
    assert calculate_declarative_pt(
        rule=TAMIL_NADU_2026_27,
        half_year_income=Decimal("500000"),
        days_employed_in_period=59,
    ) == Decimal("0")


def test_tamil_nadu_requires_half_year_income():
    with pytest.raises(
        ValueError,
        match="Half-year income required",
    ):
        calculate_declarative_pt(
            rule=TAMIL_NADU_2026_27,
            monthly_income=Decimal("100000"),
            days_employed_in_period=100,
        )


def test_tamil_nadu_requires_days_context():
    with pytest.raises(
        ValueError,
        match="Days employed",
    ):
        calculate_declarative_pt(
            rule=TAMIL_NADU_2026_27,
            half_year_income=Decimal("500000"),
        )
