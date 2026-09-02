from decimal import Decimal

import pytest

from tax_engine.professional_tax.models import PTStatus
from tax_engine.professional_tax.pt_engine import (
    calculate_professional_tax,
)


@pytest.mark.parametrize(
    ("state", "annual_income", "expected"),
    [
        ("Bihar", "300000", "0"),
        ("Bihar", "300000.01", "1000"),
        ("Bihar", "500000.01", "2000"),
        ("Bihar", "1000000.01", "2500"),

        ("Jharkhand", "300000", "0"),
        ("Jharkhand", "300000.01", "1200"),
        ("Jharkhand", "500000.01", "1800"),
        ("Jharkhand", "800000.01", "2100"),
        ("Jharkhand", "1000000.01", "2500"),
    ],
)
def test_annual_pt_states_live(
    state,
    annual_income,
    expected,
):
    result = calculate_professional_tax(
        work_state=state,
        monthly_salary_or_wages=Decimal("50000"),
        payroll_month=8,
        tax_year="2026-27",
        pt_annual_salary_or_wages=Decimal(
            annual_income
        ),
    )

    assert result.status == PTStatus.CALCULATED
    assert result.professional_tax == Decimal(expected)
    assert result.review_reason is None


@pytest.mark.parametrize(
    "state",
    [
        "Bihar",
        "Jharkhand",
    ],
)
def test_annual_pt_never_guesses_income(state):
    result = calculate_professional_tax(
        work_state=state,
        monthly_salary_or_wages=Decimal("50000"),
        payroll_month=8,
        tax_year="2026-27",
    )

    assert result.status == PTStatus.REVIEW_REQUIRED
    assert result.review_reason is not None
