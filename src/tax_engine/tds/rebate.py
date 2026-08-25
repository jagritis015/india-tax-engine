from decimal import Decimal

from tax_engine.tds.slab_calculator import calculate_slab_tax


REBATE_THRESHOLD = Decimal("1200000")
MAX_REBATE = Decimal("60000")


def calculate_rebate_and_marginal_relief(
    total_income: Decimal,
    resident_individual: bool = True,
) -> dict[str, Decimal]:
    """
    Apply section 156(2) rebate / marginal relief
    for a resident individual taxed under section 202(1).

    This function operates on normal slab-rate income only.
    Special-rate income must be handled separately.
    """

    if total_income < Decimal("0"):
        raise ValueError("total_income cannot be negative")

    slab_tax = calculate_slab_tax(total_income)

    if not resident_individual:
        return {
            "slab_tax": slab_tax,
            "rebate": Decimal("0"),
            "marginal_relief": Decimal("0"),
            "tax_after_rebate": slab_tax,
        }

    rebate = Decimal("0")
    marginal_relief = Decimal("0")

    if total_income <= REBATE_THRESHOLD:
        rebate = min(slab_tax, MAX_REBATE)

    else:
        excess_income = total_income - REBATE_THRESHOLD

        if slab_tax > excess_income:
            marginal_relief = slab_tax - excess_income

    tax_after_rebate = slab_tax - rebate - marginal_relief

    return {
        "slab_tax": slab_tax,
        "rebate": rebate,
        "marginal_relief": marginal_relief,
        "tax_after_rebate": tax_after_rebate,
    }


OLD_REGIME_REBATE_THRESHOLD = Decimal("500000")
OLD_REGIME_MAX_REBATE = Decimal("12500")


def calculate_old_regime_rebate(
    total_income: Decimal,
    slab_tax: Decimal,
    resident_individual: bool = True,
) -> Decimal:
    """
    Section 156(1), Income-tax Act, 2025.

    Resident individual:
    - Total income up to Rs 5,00,000
    - Rebate is 100% of income-tax or Rs 12,500,
      whichever is lower.
    """

    if total_income < Decimal("0"):
        raise ValueError("total_income cannot be negative")

    if slab_tax < Decimal("0"):
        raise ValueError("slab_tax cannot be negative")

    if not resident_individual:
        return Decimal("0")

    if total_income <= OLD_REGIME_REBATE_THRESHOLD:
        return min(
            slab_tax,
            OLD_REGIME_MAX_REBATE,
        )

    return Decimal("0")
