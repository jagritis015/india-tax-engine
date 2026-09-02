from dataclasses import dataclass
from datetime import date

from tax_engine.statutory.provenance import StatutoryRuleProvenance
from tax_engine.statutory.rule_registry import (
    TY_2026_27_RULES,
    StatutoryRule,
    VerificationStatus,
)
from tax_engine.statutory.verification import (
    VERIFIED_RULE_PROVENANCE,
    assert_verified_rule_has_authoritative_evidence,
)


class StatutoryRuleUnavailableError(ValueError):
    """Raised when a rule cannot safely be used as verified statutory logic."""


@dataclass(frozen=True)
class VerifiedStatutoryRule:
    rule: StatutoryRule
    provenance: StatutoryRuleProvenance


def get_verified_rule(rule_id: str, *, on_date: date) -> VerifiedStatutoryRule:
    """Resolve a production-verifiable statutory rule, failing closed otherwise."""

    rule = TY_2026_27_RULES.get(rule_id)
    if rule is None:
        raise StatutoryRuleUnavailableError(f"unknown statutory rule: {rule_id}")
    if rule.status is not VerificationStatus.VERIFIED:
        raise StatutoryRuleUnavailableError(
            f"statutory rule is not verified for production use: {rule_id}"
        )

    assert_verified_rule_has_authoritative_evidence(rule)
    provenance = VERIFIED_RULE_PROVENANCE[rule_id]
    if not provenance.applies_on(on_date):
        raise StatutoryRuleUnavailableError(
            f"statutory rule is not effective on {on_date.isoformat()}: {rule_id}"
        )

    return VerifiedStatutoryRule(rule=rule, provenance=provenance)
