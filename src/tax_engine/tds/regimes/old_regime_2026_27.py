from decimal import Decimal


TAX_YEAR = "2026-27"
REGIME = "old"

STANDARD_DEDUCTION = Decimal("50000")

SLABS = [
    (Decimal("0"), Decimal("250000"), Decimal("0.00")),
    (Decimal("250000"), Decimal("500000"), Decimal("0.05")),
    (Decimal("500000"), Decimal("1000000"), Decimal("0.20")),
    (Decimal("1000000"), None, Decimal("0.30")),
]

CESS_RATE = Decimal("0.04")
