from decimal import Decimal

from tax_engine.tds.monthly_tds import calculate_monthly_tds


TAX_YEAR = "2026-27"
TAX_YEAR_MONTHS = [
    4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3
]


def test_full_tax_year_reconciles_exactly():
    annual_tax_liability = Decimal("100010")
    tds_ytd = Decimal("0")

    deductions = []

    for index, month in enumerate(TAX_YEAR_MONTHS):
        remaining_months = 12 - index

        result = calculate_monthly_tds(
            annual_tax_liability=annual_tax_liability,
            tds_deducted_current_employer_ytd=tds_ytd,
            previous_employer_tds=Decimal("0"),
            remaining_payroll_months=remaining_months,
            tax_year=TAX_YEAR,
        )

        current_tds = result["current_month_tds"]

        deductions.append(current_tds)
        tds_ytd += current_tds

    assert len(deductions) == 12
    assert sum(deductions) == annual_tax_liability
    assert tds_ytd == Decimal("100010")


def test_last_month_clears_rounding_difference():
    annual_tax_liability = Decimal("100010")
    tds_ytd = Decimal("91670")

    result = calculate_monthly_tds(
        annual_tax_liability=annual_tax_liability,
        tds_deducted_current_employer_ytd=tds_ytd,
        previous_employer_tds=Decimal("0"),
        remaining_payroll_months=1,
        tax_year=TAX_YEAR,
    )

    assert result["remaining_tax"] == Decimal("8340")
    assert result["current_month_tds"] == Decimal("8340")
    assert (
        tds_ytd + result["current_month_tds"]
        == annual_tax_liability
    )


def test_midyear_tax_revision_is_recovered_over_remaining_months():
    """
    Example:
    April-July payroll originally estimates annual tax at Rs 1,20,000.

    In August, bonus/increment changes estimated annual tax
    to Rs 1,80,000.

    Section 392 permits adjustment for excess or deficiency during
    the Tax Year. This engine's current allocation policy spreads the
    revised balance across the remaining payroll months.
    """

    original_liability = Decimal("120000")
    revised_liability = Decimal("180000")

    tds_ytd = Decimal("0")

    # April to July: 4 payroll months
    for remaining_months in [12, 11, 10, 9]:
        result = calculate_monthly_tds(
            annual_tax_liability=original_liability,
            tds_deducted_current_employer_ytd=tds_ytd,
            previous_employer_tds=Decimal("0"),
            remaining_payroll_months=remaining_months,
            tax_year=TAX_YEAR,
        )

        tds_ytd += result["current_month_tds"]

    tds_before_revision = tds_ytd

    # August to March: annual liability revised upward
    for remaining_months in [8, 7, 6, 5, 4, 3, 2, 1]:
        result = calculate_monthly_tds(
            annual_tax_liability=revised_liability,
            tds_deducted_current_employer_ytd=tds_ytd,
            previous_employer_tds=Decimal("0"),
            remaining_payroll_months=remaining_months,
            tax_year=TAX_YEAR,
        )

        tds_ytd += result["current_month_tds"]

    assert tds_before_revision < revised_liability
    assert tds_ytd == revised_liability


def test_previous_employer_tds_reduces_current_employer_balance():
    annual_tax_liability = Decimal("240000")
    previous_employer_tds = Decimal("40000")

    current_employer_tds_ytd = Decimal("0")

    for index in range(12):
        remaining_months = 12 - index

        result = calculate_monthly_tds(
            annual_tax_liability=annual_tax_liability,
            tds_deducted_current_employer_ytd=current_employer_tds_ytd,
            previous_employer_tds=previous_employer_tds,
            remaining_payroll_months=remaining_months,
            tax_year=TAX_YEAR,
        )

        current_employer_tds_ytd += result["current_month_tds"]

    assert (
        current_employer_tds_ytd + previous_employer_tds
        == annual_tax_liability
    )
