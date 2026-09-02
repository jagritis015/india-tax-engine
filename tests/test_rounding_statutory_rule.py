from datetime import date

import pytest

from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule


def test_rounding_rule_resolves_with_section_516_provenance() -> None:
    resolved = get_verified_rule("ROUNDING", on_date=date(2026, 4, 1))

    assert resolved.rule.rule_id == "ROUNDING"
    assert resolved.rule.provision == "Section 516"
    assert resolved.provenance.rule_id == "ROUNDING"
    assert resolved.provenance.evidence_refs == ("Section 516",)


def test_rounding_rule_fails_closed_before_2025_act_effective_date() -> None:
    with pytest.raises(StatutoryRuleUnavailableError, match="not effective"):
        get_verified_rule("ROUNDING", on_date=date(2026, 3, 31))
