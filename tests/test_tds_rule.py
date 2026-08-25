from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from tax_engine.rules.tds_rule import TDSRule, ThresholdType


def test_valid_tds_rule_is_accepted():
    rule = TDSRule(
        rule_id="TEST-RULE-001",
        statutory_section="393",
        table_item="TEST",
        legacy_section="TEST",
        nature_of_payment="test_payment",
        threshold_type=ThresholdType.ANNUAL,
        threshold_amount=Decimal("50000"),
        normal_rate=Decimal("0.10"),
        effective_from=date(2026, 4, 1),
        source_reference="TEST ONLY - NOT A PRODUCTION TAX RULE",
    )

    assert rule.act_name == "Income-tax Act, 2025"
    assert rule.normal_rate == Decimal("0.10")


def test_rate_above_100_percent_is_rejected():
    with pytest.raises(ValidationError):
        TDSRule(
            rule_id="TEST-RULE-INVALID",
            statutory_section="393",
            nature_of_payment="test_payment",
            threshold_type=ThresholdType.NONE,
            normal_rate=Decimal("1.50"),
            effective_from=date(2026, 4, 1),
            source_reference="TEST ONLY",
        )
