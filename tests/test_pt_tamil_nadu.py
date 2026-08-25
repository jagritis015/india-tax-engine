from decimal import Decimal

from tax_engine.professional_tax.half_year_context import (
    PTHalfYearContext,
)
from tax_engine.professional_tax.tamil_nadu import (
    calculate_tamil_nadu_half_year_liability,
    calculate_tamil_nadu_pt,
)


def test_tamil_nadu_half_year_slabs():
    cases = [
        ("0", "0"),
        ("21000", "0"),
        ("21001", "135"),
        ("30000", "135"),
        ("30001", "315"),
        ("45000", "315"),
        ("45001", "690"),
        ("60000", "690"),
        ("60001", "1025"),
        ("75000", "1025"),
        ("75001", "1250"),
        ("1200000", "1250"),
    ]

    for income, expected in cases:
        assert (
            calculate_tamil_nadu_half_year_liability(
                Decimal(income)
            )
            == Decimal(expected)
        )


def test_august_deducts_half_year_liability():
    context = PTHalfYearContext(
        half_year_salary_or_wages=Decimal("1200000"),
        days_employed_in_half_year=150,
    )

    assert calculate_tamil_nadu_pt(
        payroll_month=8,
        context=context,
    ) == Decimal("1250")


def test_january_deducts_half_year_liability():
    context = PTHalfYearContext(
        half_year_salary_or_wages=Decimal("1200000"),
        days_employed_in_half_year=150,
    )

    assert calculate_tamil_nadu_pt(
        payroll_month=1,
        context=context,
    ) == Decimal("1250")


def test_non_deduction_month_returns_zero():
    context = PTHalfYearContext(
        half_year_salary_or_wages=Decimal("1200000"),
        days_employed_in_half_year=150,
    )

    assert calculate_tamil_nadu_pt(
        payroll_month=7,
        context=context,
    ) == Decimal("0")


def test_existing_deduction_reduces_remaining_pt():
    context = PTHalfYearContext(
        half_year_salary_or_wages=Decimal("1200000"),
        days_employed_in_half_year=150,
        pt_already_deducted_for_half_year=Decimal("500"),
    )

    assert calculate_tamil_nadu_pt(
        payroll_month=8,
        context=context,
    ) == Decimal("750")


def test_pt_cannot_become_negative():
    context = PTHalfYearContext(
        half_year_salary_or_wages=Decimal("1200000"),
        days_employed_in_half_year=150,
        pt_already_deducted_for_half_year=Decimal("1500"),
    )

    assert calculate_tamil_nadu_pt(
        payroll_month=8,
        context=context,
    ) == Decimal("0")


def test_less_than_60_days_has_no_pt_liability():
    context = PTHalfYearContext(
        half_year_salary_or_wages=Decimal("1200000"),
        days_employed_in_half_year=59,
    )

    assert calculate_tamil_nadu_pt(
        payroll_month=8,
        context=context,
    ) == Decimal("0")


def test_60_days_meets_pt_eligibility():
    context = PTHalfYearContext(
        half_year_salary_or_wages=Decimal("1200000"),
        days_employed_in_half_year=60,
    )

    assert calculate_tamil_nadu_pt(
        payroll_month=8,
        context=context,
    ) == Decimal("1250")
