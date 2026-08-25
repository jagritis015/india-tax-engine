from decimal import Decimal


TAX_YEAR = "2026-27"

ACT_NAME = "Income-tax Act, 2025"

NEW_REGIME_SECTION = "202(1)"

STANDARD_DEDUCTION_NEW_REGIME = Decimal("75000")

HEALTH_AND_EDUCATION_CESS_RATE = Decimal("0.04")

NEW_REGIME_SLABS = [
    {
        "lower": Decimal("0"),
        "upper": Decimal("400000"),
        "rate": Decimal("0.00"),
    },
    {
        "lower": Decimal("400000"),
        "upper": Decimal("800000"),
        "rate": Decimal("0.05"),
    },
    {
        "lower": Decimal("800000"),
        "upper": Decimal("1200000"),
        "rate": Decimal("0.10"),
    },
    {
        "lower": Decimal("1200000"),
        "upper": Decimal("1600000"),
        "rate": Decimal("0.15"),
    },
    {
        "lower": Decimal("1600000"),
        "upper": Decimal("2000000"),
        "rate": Decimal("0.20"),
    },
    {
        "lower": Decimal("2000000"),
        "upper": Decimal("2400000"),
        "rate": Decimal("0.25"),
    },
    {
        "lower": Decimal("2400000"),
        "upper": None,
        "rate": Decimal("0.30"),
    },
]

SOURCE_REFERENCES = {
    "tax_rates": "Income-tax Act, 2025 - section 202",
    "standard_deduction": "Income-tax Act, 2025 - section 19",
}
