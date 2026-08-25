from decimal import Decimal

from tax_engine.payroll.employee import TaxRegime


ZERO = Decimal("0")

THRESHOLD_50L = Decimal("5000000")
THRESHOLD_1CR = Decimal("10000000")
THRESHOLD_2CR = Decimal("20000000")
THRESHOLD_5CR = Decimal("50000000")


def get_surcharge_rate(
    total_income: Decimal,
    regime: TaxRegime,
) -> Decimal:
    """
    TY 2026-27 surcharge rate for normal-rate income.

    Special-rate income requires separate handling and
    is intentionally outside this V1 function.
    """

    if total_income < ZERO:
        raise ValueError("total_income cannot be negative")

    if total_income <= THRESHOLD_50L:
        return ZERO

    if total_income <= THRESHOLD_1CR:
        return Decimal("0.10")

    if total_income <= THRESHOLD_2CR:
        return Decimal("0.15")

    if total_income <= THRESHOLD_5CR:
        return Decimal("0.25")

    if regime == TaxRegime.NEW:
        return Decimal("0.25")

    return Decimal("0.37")


def calculate_surcharge(
    total_income: Decimal,
    tax_after_rebate: Decimal,
    regime: TaxRegime,
    tax_at_threshold: Decimal | None = None,
    threshold_income: Decimal | None = None,
) -> dict[str, Decimal]:
    """
    Calculate surcharge and optional marginal relief.

    Marginal relief principle:
    tax + surcharge at actual income should not exceed
    tax + surcharge at the immediately preceding threshold
    by more than the amount of income exceeding that threshold.
    """

    if tax_after_rebate < ZERO:
        raise ValueError("tax_after_rebate cannot be negative")

    rate = get_surcharge_rate(total_income, regime)

    surcharge_before_relief = tax_after_rebate * rate
    marginal_relief = ZERO

    if (
        rate > ZERO
        and tax_at_threshold is not None
        and threshold_income is not None
    ):
        excess_income = total_income - threshold_income

        tax_plus_surcharge = (
            tax_after_rebate + surcharge_before_relief
        )

        maximum_tax_plus_surcharge = (
            tax_at_threshold + excess_income
        )

        if tax_plus_surcharge > maximum_tax_plus_surcharge:
            marginal_relief = (
                tax_plus_surcharge
                - maximum_tax_plus_surcharge
            )

    surcharge_after_relief = max(
        ZERO,
        surcharge_before_relief - marginal_relief,
    )

    return {
        "surcharge_rate": rate,
        "surcharge_before_relief": surcharge_before_relief,
        "surcharge_marginal_relief": marginal_relief,
        "surcharge": surcharge_after_relief,
    }
