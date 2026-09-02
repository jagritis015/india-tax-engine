from dataclasses import dataclass
from decimal import Decimal
from enum import Enum


class CalculationBasis(str, Enum):
    MONTHLY = "MONTHLY"
    HALF_YEARLY = "HALF_YEARLY"
    ANNUAL = "ANNUAL"


@dataclass(frozen=True)
class Slab:
    lower_exclusive: Decimal | None
    upper_inclusive: Decimal | None
    amount: Decimal


@dataclass(frozen=True)
class DeclarativePTRule:
    state: str
    tax_year: str
    basis: CalculationBasis
    slabs: tuple[Slab, ...]
    effective_from: str
    source_reference: str
    minimum_days: int | None = None


def resolve_slab_amount(
    *,
    income: Decimal,
    slabs: tuple[Slab, ...],
) -> Decimal:
    """
    Resolve an exact PT amount from a verified declarative slab table.

    lower_exclusive:
        income must be > lower bound

    upper_inclusive:
        income must be <= upper bound

    None means unbounded.
    """

    income = Decimal(income)

    if income < 0:
        raise ValueError("PT income cannot be negative")

    for slab in slabs:
        lower_ok = (
            slab.lower_exclusive is None
            or income > slab.lower_exclusive
        )

        upper_ok = (
            slab.upper_inclusive is None
            or income <= slab.upper_inclusive
        )

        if lower_ok and upper_ok:
            return slab.amount

    raise ValueError(
        f"No PT slab matched income {income}"
    )


def calculate_declarative_pt(
    *,
    rule: DeclarativePTRule,
    monthly_income: Decimal | None = None,
    half_year_income: Decimal | None = None,
    annual_income: Decimal | None = None,
    days_employed_in_period: int | None = None,
) -> Decimal:
    """
    Calculate PT using only the income basis explicitly required
    by the jurisdiction's verified rule.

    This function never extrapolates one period into another.
    """

    if (
        rule.minimum_days is not None
        and days_employed_in_period is not None
        and days_employed_in_period < rule.minimum_days
    ):
        return Decimal("0")

    if rule.basis == CalculationBasis.MONTHLY:
        if monthly_income is None:
            raise ValueError(
                "Monthly income required for this PT rule"
            )
        income = monthly_income

    elif rule.basis == CalculationBasis.HALF_YEARLY:
        if half_year_income is None:
            raise ValueError(
                "Half-year income required for this PT rule"
            )

        if (
            rule.minimum_days is not None
            and days_employed_in_period is None
        ):
            raise ValueError(
                "Days employed in half-year required "
                "for this PT rule"
            )

        income = half_year_income

    elif rule.basis == CalculationBasis.ANNUAL:
        if annual_income is None:
            raise ValueError(
                "Annual income required for this PT rule"
            )
        income = annual_income

    else:
        raise ValueError(
            f"Unsupported PT calculation basis: {rule.basis}"
        )

    return resolve_slab_amount(
        income=Decimal(income),
        slabs=rule.slabs,
    )
