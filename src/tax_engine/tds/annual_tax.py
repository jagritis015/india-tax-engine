from decimal import Decimal

from tax_engine.payroll.employee import TaxRegime
from tax_engine.tds.rebate import (
    calculate_old_regime_rebate,
    calculate_rebate_and_marginal_relief,
)
from tax_engine.tds.regime_config import get_regime_config
from tax_engine.tds.rounding import round_to_nearest_ten
from tax_engine.tds.surcharge import calculate_surcharge


ZERO = Decimal("0")
CESS_RATE = Decimal("0.04")


def calculate_tax_from_slabs(
    taxable_income: Decimal,
    slabs,
) -> Decimal:
    if taxable_income < ZERO:
        raise ValueError("taxable_income cannot be negative")

    tax = ZERO

    for lower, upper, rate in slabs:
        if taxable_income <= lower:
            break

        amount_in_slab = taxable_income - lower

        if upper is not None:
            amount_in_slab = min(
                amount_in_slab,
                upper - lower,
            )

        tax += amount_in_slab * rate

    return tax


def _threshold_for_surcharge(
    taxable_income: Decimal,
    regime: TaxRegime,
) -> Decimal | None:

    if (
        regime == TaxRegime.OLD
        and taxable_income > Decimal("50000000")
    ):
        return Decimal("50000000")

    if taxable_income > Decimal("20000000"):
        return Decimal("20000000")

    if taxable_income > Decimal("10000000"):
        return Decimal("10000000")

    if taxable_income > Decimal("5000000"):
        return Decimal("5000000")

    return None


def calculate_annual_tax(
    taxable_income: Decimal,
    tax_year: str,
    regime: TaxRegime,
    resident_individual: bool = True,
    apply_surcharge: bool = True,
) -> dict[str, Decimal | str]:

    if taxable_income < ZERO:
        raise ValueError("taxable_income cannot be negative")

    # Section 516
    rounded_taxable_income = round_to_nearest_ten(
        taxable_income
    )

    config = get_regime_config(tax_year, regime)

    slab_tax = calculate_tax_from_slabs(
        rounded_taxable_income,
        config.SLABS,
    )

    rebate = ZERO
    rebate_marginal_relief = ZERO

    if regime == TaxRegime.NEW:
        rebate_result = calculate_rebate_and_marginal_relief(
            rounded_taxable_income,
            resident_individual=resident_individual,
        )

        rebate = rebate_result["rebate"]
        rebate_marginal_relief = rebate_result["marginal_relief"]

    else:
        rebate = calculate_old_regime_rebate(
            total_income=rounded_taxable_income,
            slab_tax=slab_tax,
            resident_individual=resident_individual,
        )

    tax_after_rebate = max(
        ZERO,
        slab_tax - rebate - rebate_marginal_relief,
    )

    surcharge_rate = ZERO
    surcharge_before_relief = ZERO
    surcharge_marginal_relief = ZERO
    surcharge = ZERO

    if apply_surcharge:
        threshold_income = _threshold_for_surcharge(
            rounded_taxable_income,
            regime,
        )

        tax_at_threshold = None

        if threshold_income is not None:
            threshold_result = calculate_annual_tax(
                taxable_income=threshold_income,
                tax_year=tax_year,
                regime=regime,
                resident_individual=resident_individual,
                apply_surcharge=True,
            )

            tax_at_threshold = (
                threshold_result["tax_after_rebate"]
                + threshold_result["surcharge"]
            )

        surcharge_result = calculate_surcharge(
            total_income=rounded_taxable_income,
            tax_after_rebate=tax_after_rebate,
            regime=regime,
            tax_at_threshold=tax_at_threshold,
            threshold_income=threshold_income,
        )

        surcharge_rate = surcharge_result["surcharge_rate"]
        surcharge_before_relief = surcharge_result[
            "surcharge_before_relief"
        ]
        surcharge_marginal_relief = surcharge_result[
            "surcharge_marginal_relief"
        ]
        surcharge = surcharge_result["surcharge"]

    tax_plus_surcharge = (
        tax_after_rebate + surcharge
    )

    cess = tax_plus_surcharge * CESS_RATE

    tax_before_rounding = (
        tax_plus_surcharge + cess
    )

    # Section 516 final amount payable
    annual_tax_liability = round_to_nearest_ten(
        tax_before_rounding
    )

    return {
        "tax_year": tax_year,
        "regime": regime.value,
        "taxable_income_before_rounding": taxable_income,
        "taxable_income": rounded_taxable_income,
        "slab_tax": slab_tax,
        "rebate": rebate,
        "rebate_marginal_relief": rebate_marginal_relief,
        "marginal_relief": rebate_marginal_relief,
        "tax_after_rebate": tax_after_rebate,
        "surcharge_rate": surcharge_rate,
        "surcharge_before_relief": surcharge_before_relief,
        "surcharge_marginal_relief": surcharge_marginal_relief,
        "surcharge": surcharge,
        "tax_plus_surcharge": tax_plus_surcharge,
        "cess_rate": CESS_RATE,
        "cess": cess,
        "tax_before_rounding": tax_before_rounding,
        "annual_tax_liability": annual_tax_liability,
    }
