from decimal import Decimal

import pytest

from tax_engine.tds.monthly_tds import calculate_monthly_tds


def test_monthly_tds_from_annual_liability():
    result = calculate_monthly_tds(
        annual_tax_liability=Decimal("120000"),
        tds_deducted_current_employer_ytd=Decimal("40000"),
        previous_employer_tds=Decimal("0"),
        remaining_payroll_months=8,
    )

    assert result["remaining_tax"] == Decimal("80000")
    assert result["current_month_tds"] == Decimal("10000")


def test_previous_employer_tds_is_considered():
    result = calculate_monthly_tds(
        annual_tax_liability=Decimal("150000"),
        tds_deducted_current_employer_ytd=Decimal("30000"),
        previous_employer_tds=Decimal("20000"),
        remaining_payroll_months=5,
    )

    assert result["total_tds_credit_considered"] == Decimal("50000")
    assert result["remaining_tax"] == Decimal("100000")
    assert result["current_month_tds"] == Decimal("20000")


def test_excess_prior_tds_does_not_create_negative_deduction():
    result = calculate_monthly_tds(
        annual_tax_liability=Decimal("50000"),
        tds_deducted_current_employer_ytd=Decimal("60000"),
        previous_employer_tds=Decimal("0"),
        remaining_payroll_months=4,
    )

    assert result["remaining_tax"] == Decimal("0")
    assert result["current_month_tds"] == Decimal("0")


def test_last_month_collects_full_remaining_tax():
    result = calculate_monthly_tds(
        annual_tax_liability=Decimal("90000"),
        tds_deducted_current_employer_ytd=Decimal("80000"),
        previous_employer_tds=Decimal("0"),
        remaining_payroll_months=1,
    )

    assert result["current_month_tds"] == Decimal("10000")


def test_zero_remaining_months_is_rejected():
    with pytest.raises(ValueError):
        calculate_monthly_tds(
            annual_tax_liability=Decimal("100000"),
            tds_deducted_current_employer_ytd=Decimal("0"),
            previous_employer_tds=Decimal("0"),
            remaining_payroll_months=0,
        )


def test_final_payroll_month_absorbs_exact_residual():
    result = calculate_monthly_tds(
        annual_tax_liability=Decimal("100010"),
        tds_deducted_current_employer_ytd=Decimal("91670"),
        previous_employer_tds=Decimal("0"),
        remaining_payroll_months=1,
    )

    assert result["remaining_tax"] == Decimal("8340")
    assert result["current_month_tds"] == Decimal("8340")
