from decimal import Decimal

import pytest

from tax_engine.payroll.employee import TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule
from tax_engine.tds.schedule_xv import (
    SCHEDULE_XV_AGGREGATE_LIMIT,
    calculate_schedule_xv_deduction,
)


def test_schedule_xv_rule_is_verified_for_ty_2026_27():
    result = get_verified_rule(
        "SCHEDULE_XV_DEDUCTION",
        on_date=__import__("datetime").date(2026, 4, 1),
    )
    assert result.rule.tax_year == "2026-27"
    assert "Section 123" in result.rule.provision
    assert len(result.provenance.sources) >= 2


def test_old_regime_caps_schedule_xv_at_one_lakh_fifty_thousand():
    result = calculate_schedule_xv_deduction(
        qualifying_payments_total=Decimal("225000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
    )
    assert result["aggregate_limit"] == SCHEDULE_XV_AGGREGATE_LIMIT
    assert result["allowed_deduction"] == Decimal("150000")
    assert result["disallowed_amount"] == Decimal("75000")


def test_old_regime_allows_amount_below_cap():
    result = calculate_schedule_xv_deduction(
        qualifying_payments_total=Decimal("90000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
    )
    assert result["allowed_deduction"] == Decimal("90000")
    assert result["disallowed_amount"] == Decimal("0")


def test_new_regime_does_not_allow_section_123_deduction():
    result = calculate_schedule_xv_deduction(
        qualifying_payments_total=Decimal("150000"),
        tax_year="2026-27",
        regime=TaxRegime.NEW,
    )
    assert result["allowed_deduction"] == Decimal("0")
    assert result["reason"] == "not_allowed_under_section_202_new_regime"


def test_negative_schedule_xv_input_is_rejected():
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate_schedule_xv_deduction(
            qualifying_payments_total=Decimal("-1"),
            tax_year="2026-27",
            regime=TaxRegime.OLD,
        )


def test_unregistered_future_tax_year_fails_closed():
    with pytest.raises(StatutoryRuleUnavailableError):
        calculate_schedule_xv_deduction(
            qualifying_payments_total=Decimal("150000"),
            tax_year="2027-28",
            regime=TaxRegime.OLD,
        )


def test_schedule_xv_function_does_not_claim_to_validate_instrument_eligibility():
    result = calculate_schedule_xv_deduction(
        qualifying_payments_total=Decimal("100000"),
        tax_year="2026-27",
        regime=TaxRegime.OLD,
    )
    assert result["input_scope"] == "upstream_validated_schedule_xv_qualifying_payments"
