from datetime import date

import pytest

from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule
from tax_engine.statutory.rule_registry import TY_2026_27_RULES, VerificationStatus


def test_surcharge_is_verified_for_tax_year_2026_27() -> None:
    rule = TY_2026_27_RULES["SURCHARGE"]

    assert rule.status is VerificationStatus.VERIFIED
    resolved = get_verified_rule("SURCHARGE", on_date=date(2026, 4, 1))
    assert resolved.provenance.rule_version == "2026-27.1"
    assert "Finance Act, 2026" in resolved.provenance.sources[0].title


def test_health_and_education_cess_is_verified_for_tax_year_2026_27() -> None:
    rule = TY_2026_27_RULES["HEALTH_EDUCATION_CESS"]

    assert rule.status is VerificationStatus.VERIFIED
    resolved = get_verified_rule("HEALTH_EDUCATION_CESS", on_date=date(2027, 3, 31))
    assert resolved.provenance.rule_version == "2026-27.1"


def test_finance_act_2026_rules_fail_closed_outside_tax_year() -> None:
    with pytest.raises(StatutoryRuleUnavailableError):
        get_verified_rule("SURCHARGE", on_date=date(2027, 4, 1))

    with pytest.raises(StatutoryRuleUnavailableError):
        get_verified_rule("HEALTH_EDUCATION_CESS", on_date=date(2027, 4, 1))
