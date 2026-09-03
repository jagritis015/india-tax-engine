from dataclasses import replace

import pytest

from tax_engine.statutory.rule_registry import TY_2026_27_RULES, VerificationStatus
from tax_engine.statutory.verification import (
    VERIFIED_RULE_PROVENANCE,
    assert_verified_rule_has_authoritative_evidence,
)


def test_every_verified_registry_rule_has_authoritative_provenance():
    verified_rules = [
        rule
        for rule in TY_2026_27_RULES.values()
        if rule.status is VerificationStatus.VERIFIED
    ]

    assert verified_rules
    for rule in verified_rules:
        assert_verified_rule_has_authoritative_evidence(rule)
        provenance = VERIFIED_RULE_PROVENANCE[rule.rule_id]
        assert provenance.sources
        assert all(source.source_url.startswith("https://") for source in provenance.sources)


def test_verification_gate_fails_closed_when_evidence_is_missing():
    source_rule = TY_2026_27_RULES["SALARY_TDS"]
    unsupported_rule = replace(source_rule, rule_id="UNSUPPORTED_VERIFIED_RULE")

    with pytest.raises(ValueError, match="lacks provenance"):
        assert_verified_rule_has_authoritative_evidence(unsupported_rule)


def test_review_required_rule_does_not_require_verified_evidence():
    source_rule = TY_2026_27_RULES["HRA_EXEMPTION"]
    review_rule = replace(
        source_rule,
        rule_id="REVIEW_ONLY_RULE",
        status=VerificationStatus.REVIEW_REQUIRED,
    )

    assert review_rule.status is VerificationStatus.REVIEW_REQUIRED
    assert_verified_rule_has_authoritative_evidence(review_rule)
