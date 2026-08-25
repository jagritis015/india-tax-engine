from decimal import Decimal

from tax_engine.tds.rebate import calculate_rebate_and_marginal_relief


def test_rebate_at_12_lakh():
    result = calculate_rebate_and_marginal_relief(
        Decimal("1200000")
    )

    assert result["slab_tax"] == Decimal("60000")
    assert result["rebate"] == Decimal("60000")
    assert result["tax_after_rebate"] == Decimal("0")


def test_marginal_relief_at_12_10_lakh():
    result = calculate_rebate_and_marginal_relief(
        Decimal("1210000")
    )

    assert result["slab_tax"] == Decimal("61500")
    assert result["marginal_relief"] == Decimal("51500")
    assert result["tax_after_rebate"] == Decimal("10000")


def test_marginal_relief_at_12_50_lakh():
    result = calculate_rebate_and_marginal_relief(
        Decimal("1250000")
    )

    assert result["slab_tax"] == Decimal("67500")
    assert result["marginal_relief"] == Decimal("17500")
    assert result["tax_after_rebate"] == Decimal("50000")


def test_no_rebate_for_non_resident():
    result = calculate_rebate_and_marginal_relief(
        Decimal("1200000"),
        resident_individual=False,
    )

    assert result["rebate"] == Decimal("0")
    assert result["marginal_relief"] == Decimal("0")
    assert result["tax_after_rebate"] == Decimal("60000")
