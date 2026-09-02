from decimal import Decimal

from tax_engine.professional_tax.declarative import (
    CalculationBasis,
    DeclarativePTRule,
    Slab,
)


TELANGANA_2026_27 = DeclarativePTRule(
    state="telangana",
    tax_year="2026-27",
    basis=CalculationBasis.MONTHLY,
    effective_from="2026-04-01",
    source_reference=(
        "Government of Telangana Commercial Taxes "
        "Professional Tax Schedule"
    ),
    slabs=(
        Slab(
            lower_exclusive=None,
            upper_inclusive=Decimal("15000"),
            amount=Decimal("0"),
        ),
        Slab(
            lower_exclusive=Decimal("15000"),
            upper_inclusive=Decimal("20000"),
            amount=Decimal("150"),
        ),
        Slab(
            lower_exclusive=Decimal("20000"),
            upper_inclusive=None,
            amount=Decimal("200"),
        ),
    ),
)


NAGALAND_2026_27 = DeclarativePTRule(
    state="nagaland",
    tax_year="2026-27",
    basis=CalculationBasis.MONTHLY,
    effective_from="2026-04-01",
    source_reference=(
        "Government of Nagaland Department of State Taxes "
        "Professional Tax Schedule"
    ),
    slabs=(
        Slab(None, Decimal("4000"), Decimal("0")),
        Slab(
            Decimal("4000"),
            Decimal("5000"),
            Decimal("35"),
        ),
        Slab(
            Decimal("5000"),
            Decimal("7000"),
            Decimal("75"),
        ),
        Slab(
            Decimal("7000"),
            Decimal("9000"),
            Decimal("110"),
        ),
        Slab(
            Decimal("9000"),
            Decimal("12000"),
            Decimal("180"),
        ),
        Slab(
            Decimal("12000"),
            None,
            Decimal("208"),
        ),
    ),
)


TAMIL_NADU_2026_27 = DeclarativePTRule(
    state="tamil_nadu",
    tax_year="2026-27",
    basis=CalculationBasis.HALF_YEARLY,
    effective_from="2026-04-01",
    source_reference=(
        "Government of Tamil Nadu local body "
        "Professional Tax schedule"
    ),
    minimum_days=60,
    slabs=(
        Slab(None, Decimal("21000"), Decimal("0")),
        Slab(
            Decimal("21000"),
            Decimal("30000"),
            Decimal("135"),
        ),
        Slab(
            Decimal("30000"),
            Decimal("45000"),
            Decimal("315"),
        ),
        Slab(
            Decimal("45000"),
            Decimal("60000"),
            Decimal("690"),
        ),
        Slab(
            Decimal("60000"),
            Decimal("75000"),
            Decimal("1025"),
        ),
        Slab(
            Decimal("75000"),
            None,
            Decimal("1250"),
        ),
    ),
)


VERIFIED_DECLARATIVE_SCHEDULES = {
    ("telangana", "2026-27"): TELANGANA_2026_27,
    ("nagaland", "2026-27"): NAGALAND_2026_27,
    ("tamil_nadu", "2026-27"): TAMIL_NADU_2026_27,
}


def get_verified_schedule(
    state: str,
    tax_year: str,
) -> DeclarativePTRule | None:
    return VERIFIED_DECLARATIVE_SCHEDULES.get(
        (state, tax_year)
    )


# =========================================================
# ASSAM — VERIFIED MONTHLY EMPLOYEE SCHEDULE
# =========================================================

ASSAM_2026_27 = DeclarativePTRule(
    state="assam",
    tax_year="2026-27",
    basis=CalculationBasis.MONTHLY,
    effective_from="2026-04-01",
    source_reference=(
        "Commissionerate of Taxes, Government of Assam — "
        "Professional Tax employee schedule"
    ),
    slabs=(
        Slab(
            lower_exclusive=None,
            upper_inclusive=Decimal("3499.99"),
            amount=Decimal("0"),
        ),
        Slab(
            lower_exclusive=Decimal("3499.99"),
            upper_inclusive=Decimal("4999.99"),
            amount=Decimal("30"),
        ),
        Slab(
            lower_exclusive=Decimal("4999.99"),
            upper_inclusive=Decimal("6999.99"),
            amount=Decimal("75"),
        ),
        Slab(
            lower_exclusive=Decimal("6999.99"),
            upper_inclusive=Decimal("8999.99"),
            amount=Decimal("110"),
        ),
        Slab(
            lower_exclusive=Decimal("9000"),
            upper_inclusive=None,
            amount=Decimal("208"),
        ),
    ),
)


# =========================================================
# BIHAR — VERIFIED ANNUAL LIABILITY SCHEDULE
# =========================================================

BIHAR_2026_27 = DeclarativePTRule(
    state="bihar",
    tax_year="2026-27",
    basis=CalculationBasis.ANNUAL,
    effective_from="2026-04-01",
    source_reference=(
        "Commercial Taxes Department, Government of Bihar — "
        "Professional Tax Schedule"
    ),
    slabs=(
        Slab(None, Decimal("300000"), Decimal("0")),
        Slab(
            Decimal("300000"),
            Decimal("500000"),
            Decimal("1000"),
        ),
        Slab(
            Decimal("500000"),
            Decimal("1000000"),
            Decimal("2000"),
        ),
        Slab(
            Decimal("1000000"),
            None,
            Decimal("2500"),
        ),
    ),
)


# =========================================================
# JHARKHAND — VERIFIED ANNUAL EMPLOYEE LIABILITY SCHEDULE
# =========================================================

JHARKHAND_2026_27 = DeclarativePTRule(
    state="jharkhand",
    tax_year="2026-27",
    basis=CalculationBasis.ANNUAL,
    effective_from="2026-04-01",
    source_reference=(
        "Commercial Taxes Department, Government of Jharkhand — "
        "employee Professional Tax salary/wage schedule"
    ),
    slabs=(
        Slab(None, Decimal("300000"), Decimal("0")),
        Slab(
            Decimal("300000"),
            Decimal("500000"),
            Decimal("1200"),
        ),
        Slab(
            Decimal("500000"),
            Decimal("800000"),
            Decimal("1800"),
        ),
        Slab(
            Decimal("800000"),
            Decimal("1000000"),
            Decimal("2100"),
        ),
        Slab(
            Decimal("1000000"),
            None,
            Decimal("2500"),
        ),
    ),
)


VERIFIED_DECLARATIVE_SCHEDULES.update({
    ("assam", "2026-27"): ASSAM_2026_27,
    ("bihar", "2026-27"): BIHAR_2026_27,
    ("jharkhand", "2026-27"): JHARKHAND_2026_27,
})
