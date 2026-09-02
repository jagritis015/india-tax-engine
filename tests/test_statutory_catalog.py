from datetime import date

import pytest

from tax_engine.statutory.catalog import (
    StatutoryRuleUnavailableError,
    get_verified_rule,
)


def test_verified_rule_resolves_with_provenance() -> None:
    resolved = get_verified_rule("SALARY_TDS", on_date=date(2026, 4, 1))

    assert resolved.rule.rule_id == "SALARY_TDS"
    assert resolved.provenance.rule_id == "SALARY_TDS"
    assert resolved.provenance.applies_on(date(2026, 4, 1))
    assert resolved.provenance.evidence_refs == ("Section 392",)


def test_review_required_rule_fails_closed() -> None:
    with pytest.raises(StatutoryRuleUnavailableError, match="not verified"):
        get_verified_rule("HRA_EXEMPTION", on_date=date(2026, 4, 1))


def test_not_implemented_rule_fails_closed() -> None:
    with pytest.raises(StatutoryRuleUnavailableError, match="not verified"):
        get_verified_rule("SURCHARGE", on_date=date(2026, 4, 1))


def test_verified_rule_cannot_be_used_before_effective_date() -> None:
    with pytest.raises(StatutoryRuleUnavailableError, match="not effective"):
        get_verified_rule("NEW_REGIME_RATES", on_date=date(2026, 3, 31))


def test_unknown_rule_fails_closed() -> None:
    with pytest.raises(StatutoryRuleUnavailableError, match="unknown"):
        get_verified_rule("UNKNOWN_RULE", on_date=date(2026, 4, 1))
