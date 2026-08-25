from decimal import Decimal


TAX_YEAR = "2026-27"
REGIME = "new"

STANDARD_DEDUCTION = Decimal("75000")

SLABS = [
    (Decimal("0"), Decimal("400000"), Decimal("0.00")),
    (Decimal("400000"), Decimal("800000"), Decimal("0.05")),
    (Decimal("800000"), Decimal("1200000"), Decimal("0.10")),
    (Decimal("1200000"), Decimal("1600000"), Decimal("0.15")),
    (Decimal("1600000"), Decimal("2000000"), Decimal("0.20")),
    (Decimal("2000000"), Decimal("2400000"), Decimal("0.25")),
    (Decimal("2400000"), None, Decimal("0.30")),
]

REBATE_THRESHOLD = Decimal("1200000")
MAX_REBATE = Decimal("60000")

CESS_RATE = Decimal("0.04")
