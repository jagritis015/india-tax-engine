from decimal import Decimal

from tax_engine.tds.rounding import round_to_nearest_ten


def test_round_down_to_nearest_ten():
    assert round_to_nearest_ten(
        Decimal("100004")
    ) == Decimal("100000")


def test_round_up_to_nearest_ten():
    assert round_to_nearest_ten(
        Decimal("100005")
    ) == Decimal("100010")


def test_paise_are_ignored_before_rounding():
    assert round_to_nearest_ten(
        Decimal("100005.99")
    ) == Decimal("100010")


def test_amount_with_last_digit_below_5_rounds_down():
    assert round_to_nearest_ten(
        Decimal("7298.99")
    ) == Decimal("7300")
