from decimal import Decimal

from tax_engine.tds.tax_year_2026_27 import NEW_REGIME_SLABS


ZERO = Decimal("0")


def calculate_slab_tax(taxable_income: Decimal) -> Decimal:
    """
    Calculate basic income tax using TY 2026-27
    section 202 new-regime slabs.

    This function calculates slab tax only.
    It does NOT apply rebate, marginal relief,
    surcharge, cess, or salary TDS allocation.
    """

    if taxable_income < ZERO:
        raise ValueError("taxable_income cannot be negative")

    tax = ZERO

    for slab in NEW_REGIME_SLABS:
        lower = slab["lower"]
        upper = slab["upper"]
        rate = slab["rate"]

        if taxable_income <= lower:
            break

        taxable_in_slab = taxable_income - lower

        if upper is not None:
            slab_width = upper - lower
            taxable_in_slab = min(taxable_in_slab, slab_width)

        tax += taxable_in_slab * rate

    return tax
