from datetime import date

from tax_engine.statutory.law import IncomeTaxAct
from tax_engine.statutory.provenance import (
    SourceAuthority,
    StatutoryRuleProvenance,
    StatutorySource,
)
from tax_engine.statutory.rule_registry import StatutoryRule, VerificationStatus


_INCOME_TAX_ACT_2025_URL = (
    "https://incometaxindia.gov.in/Documents/Act/Income-tax-Act-2025.pdf"
)


VERIFIED_RULE_PROVENANCE: dict[str, StatutoryRuleProvenance] = {
    "SALARY_TDS": StatutoryRuleProvenance(
        rule_id="SALARY_TDS",
        rule_version="2026-27.1",
        act=IncomeTaxAct.ACT_2025,
        effective_from=date(2026, 4, 1),
        effective_to=None,
        sources=(
            StatutorySource(
                authority=SourceAuthority.ACT,
                title="Income-tax Act, 2025",
                reference="Section 392",
                source_url=_INCOME_TAX_ACT_2025_URL,
            ),
        ),
    ),
    "NEW_REGIME_RATES": StatutoryRuleProvenance(
        rule_id="NEW_REGIME_RATES",
        rule_version="2026-27.1",
        act=IncomeTaxAct.ACT_2025,
        effective_from=date(2026, 4, 1),
        effective_to=None,
        sources=(
            StatutorySource(
                authority=SourceAuthority.ACT,
                title="Income-tax Act, 2025",
                reference="Section 202",
                source_url=_INCOME_TAX_ACT_2025_URL,
            ),
        ),
    ),
    "REBATE": StatutoryRuleProvenance(
        rule_id="REBATE",
        rule_version="2026-27.1",
        act=IncomeTaxAct.ACT_2025,
        effective_from=date(2026, 4, 1),
        effective_to=None,
        sources=(
            StatutorySource(
                authority=SourceAuthority.ACT,
                title="Income-tax Act, 2025",
                reference="Sections 155 and 156",
                source_url=_INCOME_TAX_ACT_2025_URL,
            ),
        ),
    ),
}


def assert_verified_rule_has_authoritative_evidence(rule: StatutoryRule) -> None:
    """Fail closed if a registry rule is marked VERIFIED without evidence.

    A rule may be executable elsewhere, but the statutory registry must not call
    it VERIFIED unless an immutable provenance record exists and matches the
    registry rule identity and applicability period.
    """

    if rule.status is not VerificationStatus.VERIFIED:
        return

    provenance = VERIFIED_RULE_PROVENANCE.get(rule.rule_id)
    if provenance is None:
        raise ValueError(f"verified statutory rule lacks provenance: {rule.rule_id}")
    if provenance.rule_id != rule.rule_id:
        raise ValueError("statutory provenance rule_id mismatch")

    expected_start_year = int(rule.tax_year.split("-", 1)[0])
    if provenance.effective_from != date(expected_start_year, 4, 1):
        raise ValueError("statutory provenance effective date does not match tax year")
