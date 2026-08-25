from decimal import Decimal

import pytest

from tax_engine.tds.slab_calculator import calculate_slab_tax


@pytest.mark.parametrize(
    "taxable_income, expected_tax",
    [
        ("0", "0"),
        ("400000", "0"),
        ("800000", "20000"),
        ("1200000", "60000"),
        ("1600000", "120000"),
        ("2000000", "200000"),
        ("2400000", "300000"),
        ("3000000", "480000"),
    ],
)
def test_section_202_slab_tax(taxable_income, expected_tax):
    assert calculate_slab_tax(
        Decimal(taxable_income)
    ) == Decimal(expected_tax)


def test_negative_taxable_income_is_rejected():
    with pytest.raises(ValueError):
        calculate_slab_tax(Decimal("-1"))
