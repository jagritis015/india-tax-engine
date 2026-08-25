from decimal import Decimal

from tax_engine.payroll.employee import TaxRegime
from tax_engine.tds.annual_tax import calculate_annual_tax
from tax_engine.tds.surcharge import get_surcharge_rate


def test_no_surcharge_at_50_lakh():
    assert get_surcharge_rate(
        Decimal("5000000"),
        TaxRegime.NEW,
    ) == Decimal("0")


def test_10_percent_above_50_lakh():
    assert get_surcharge_rate(
        Decimal("5000001"),
        TaxRegime.NEW,
    ) == Decimal("0.10")


def test_15_percent_above_1_crore():
    assert get_surcharge_rate(
        Decimal("10000001"),
        TaxRegime.NEW,
    ) == Decimal("0.15")


def test_25_percent_above_2_crore_new_regime():
    assert get_surcharge_rate(
        Decimal("20000001"),
        TaxRegime.NEW,
    ) == Decimal("0.25")


def test_new_regime_caps_surcharge_at_25_percent_above_5_crore():
    assert get_surcharge_rate(
        Decimal("60000000"),
        TaxRegime.NEW,
    ) == Decimal("0.25")


def test_old_regime_37_percent_above_5_crore():
    assert get_surcharge_rate(
        Decimal("60000000"),
        TaxRegime.OLD,
    ) == Decimal("0.37")


def test_cess_is_on_tax_plus_surcharge():
    result = calculate_annual_tax(
        taxable_income=Decimal("6000000"),
        tax_year="2026-27",
        regime=TaxRegime.NEW,
    )

    expected_cess = (
        result["tax_after_rebate"]
        + result["surcharge"]
    ) * Decimal("0.04")

    assert result["cess"] == expected_cess


def test_marginal_relief_near_50_lakh_threshold():
    at_threshold = calculate_annual_tax(
        taxable_income=Decimal("5000000"),
        tax_year="2026-27",
        regime=TaxRegime.NEW,
    )

    just_above = calculate_annual_tax(
        taxable_income=Decimal("5001000"),
        tax_year="2026-27",
        regime=TaxRegime.NEW,
    )

    tax_at_50l_before_cess = (
        at_threshold["tax_after_rebate"]
        + at_threshold["surcharge"]
    )

    tax_above_before_cess = (
        just_above["tax_after_rebate"]
        + just_above["surcharge"]
    )

    assert (
        tax_above_before_cess - tax_at_50l_before_cess
    ) <= Decimal("1000")


def test_exactly_1_crore_uses_10_percent_surcharge():
    assert get_surcharge_rate(
        Decimal("10000000"),
        TaxRegime.NEW,
    ) == Decimal("0.10")


def test_one_rupee_above_1_crore_uses_15_percent():
    assert get_surcharge_rate(
        Decimal("10000001"),
        TaxRegime.NEW,
    ) == Decimal("0.15")


def test_exactly_2_crore_uses_15_percent():
    assert get_surcharge_rate(
        Decimal("20000000"),
        TaxRegime.NEW,
    ) == Decimal("0.15")


def test_one_rupee_above_2_crore_uses_25_percent():
    assert get_surcharge_rate(
        Decimal("20000001"),
        TaxRegime.NEW,
    ) == Decimal("0.25")


def test_new_regime_exactly_5_crore_is_25_percent():
    assert get_surcharge_rate(
        Decimal("50000000"),
        TaxRegime.NEW,
    ) == Decimal("0.25")


def test_new_regime_above_5_crore_stays_25_percent():
    assert get_surcharge_rate(
        Decimal("50000001"),
        TaxRegime.NEW,
    ) == Decimal("0.25")


def test_old_regime_exactly_5_crore_is_25_percent():
    assert get_surcharge_rate(
        Decimal("50000000"),
        TaxRegime.OLD,
    ) == Decimal("0.25")


def test_old_regime_above_5_crore_becomes_37_percent():
    assert get_surcharge_rate(
        Decimal("50000001"),
        TaxRegime.OLD,
    ) == Decimal("0.37")


def test_new_regime_above_5_crore_has_no_5cr_marginal_relief_trigger():
    result = calculate_annual_tax(
        taxable_income=Decimal("50001000"),
        tax_year="2026-27",
        regime=TaxRegime.NEW,
    )

    assert result["surcharge_rate"] == Decimal("0.25")


def test_old_regime_marginal_relief_near_5_crore():
    at_threshold = calculate_annual_tax(
        taxable_income=Decimal("50000000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
    )

    just_above = calculate_annual_tax(
        taxable_income=Decimal("50001000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
    )

    threshold_tax_before_cess = (
        at_threshold["tax_after_rebate"]
        + at_threshold["surcharge"]
    )

    actual_tax_before_cess = (
        just_above["tax_after_rebate"]
        + just_above["surcharge"]
    )

    assert (
        actual_tax_before_cess
        - threshold_tax_before_cess
    ) <= Decimal("1000")
