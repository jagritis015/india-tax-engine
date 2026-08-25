from decimal import Decimal, ROUND_DOWN


TEN = Decimal("10")
ZERO = Decimal("0")


def round_to_nearest_ten(amount: Decimal) -> Decimal:
    """
    Section 516, Income-tax Act, 2025.

    Ignore paise first, then round the whole-rupee amount
    to the nearest multiple of Rs 10.

    Last digit:
    0-4 -> round down
    5-9 -> round up
    """

    if amount < ZERO:
        raise ValueError("amount cannot be negative")

    whole_rupees = amount.quantize(
        Decimal("1"),
        rounding=ROUND_DOWN,
    )

    remainder = whole_rupees % TEN

    if remainder >= Decimal("5"):
        return whole_rupees + (TEN - remainder)

    return whole_rupees - remainder
