from decimal import Decimal

from tax_engine.payroll.employee import TaxRegime
from tax_engine.tds.annual_tax import calculate_annual_tax


def test_new_regime_12_lakh_has_zero_tax_after_rebate():
    result = calculate_annual_tax(
        taxable_income=Decimal("1200000"),
        tax_year="2026-27",
        regime=TaxRegime.NEW,
    )

    assert result["slab_tax"] == Decimal("60000")
    assert result["rebate"] == Decimal("60000")
    assert result["annual_tax_liability"] == Decimal("0")


def test_new_regime_12_10_lakh_marginal_relief_and_cess():
    result = calculate_annual_tax(
        taxable_income=Decimal("1210000"),
        tax_year="2026-27",
        regime=TaxRegime.NEW,
    )

    assert result["slab_tax"] == Decimal("61500")
    assert result["marginal_relief"] == Decimal("51500")
    assert result["tax_after_rebate"] == Decimal("10000")
    assert result["cess"] == Decimal("400")
    assert result["annual_tax_liability"] == Decimal("10400")


def test_new_regime_15_lakh():
    result = calculate_annual_tax(
        taxable_income=Decimal("1500000"),
        tax_year="2026-27",
        regime=TaxRegime.NEW,
    )

    assert result["slab_tax"] == Decimal("105000")
    assert result["rebate"] == Decimal("0")
    assert result["annual_tax_liability"] == Decimal("109200")


def test_old_regime_15_lakh():
    result = calculate_annual_tax(
        taxable_income=Decimal("1500000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
    )

    assert result["slab_tax"] == Decimal("262500")
    assert result["annual_tax_liability"] == Decimal("273000")


def test_old_regime_5_lakh_gets_section_156_rebate():
    result = calculate_annual_tax(
        taxable_income=Decimal("500000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
        resident_individual=True,
    )

    assert result["slab_tax"] == Decimal("12500")
    assert result["rebate"] == Decimal("12500")
    assert result["tax_after_rebate"] == Decimal("0")
    assert result["cess"] == Decimal("0")
    assert result["annual_tax_liability"] == Decimal("0")


def test_old_regime_above_5_lakh_gets_no_rebate():
    result = calculate_annual_tax(
        taxable_income=Decimal("501000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
        resident_individual=True,
    )

    assert result["rebate"] == Decimal("0")
    assert result["annual_tax_liability"] > Decimal("0")


def test_non_resident_does_not_get_old_regime_rebate():
    result = calculate_annual_tax(
        taxable_income=Decimal("500000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
        resident_individual=False,
    )

    assert result["rebate"] == Decimal("0")
