from decimal import Decimal

import pytest

from tax_engine.professional_tax.declarative import (
    calculate_declarative_pt,
)
from tax_engine.professional_tax.pt_engine import (
    calculate_professional_tax,
)
from tax_engine.professional_tax.verified_schedules_2026_27 import (
    ASSAM_2026_27,
    BIHAR_2026_27,
    JHARKHAND_2026_27,
)


@pytest.mark.parametrize(
    ("salary", "expected"),
    [
        ("0", "0"),
        ("3499.99", "0"),
        ("3500", "30"),
        ("4999.99", "30"),
        ("5000", "75"),
        ("6999.99", "75"),
        ("7000", "110"),
        ("8999.99", "110"),
        ("9000.01", "208"),
        ("50000", "208"),
    ],
)
def test_assam_live_monthly_boundaries(
    salary,
    expected,
):
    result = calculate_professional_tax(
        work_state="Assam",
        monthly_salary_or_wages=Decimal(salary),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.professional_tax == Decimal(expected)
    assert result.review_reason is None


@pytest.mark.parametrize(
    ("annual_income", "expected"),
    [
        ("300000", "0"),
        ("300000.01", "1000"),
        ("500000", "1000"),
        ("500000.01", "2000"),
        ("1000000", "2000"),
        ("1000000.01", "2500"),
    ],
)
def test_bihar_annual_liability(
    annual_income,
    expected,
):
    assert calculate_declarative_pt(
        rule=BIHAR_2026_27,
        annual_income=Decimal(annual_income),
    ) == Decimal(expected)


@pytest.mark.parametrize(
    ("annual_income", "expected"),
    [
        ("300000", "0"),
        ("300000.01", "1200"),
        ("500000", "1200"),
        ("500000.01", "1800"),
        ("800000", "1800"),
        ("800000.01", "2100"),
        ("1000000", "2100"),
        ("1000000.01", "2500"),
    ],
)
def test_jharkhand_annual_liability(
    annual_income,
    expected,
):
    assert calculate_declarative_pt(
        rule=JHARKHAND_2026_27,
        annual_income=Decimal(annual_income),
    ) == Decimal(expected)
