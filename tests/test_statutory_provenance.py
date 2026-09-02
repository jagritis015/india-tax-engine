from datetime import date

import pytest

from tax_engine.statutory.law import IncomeTaxAct
from tax_engine.statutory.provenance import (
    SourceAuthority,
    StatutoryRuleProvenance,
    StatutorySource,
)


def _source() -> StatutorySource:
    return StatutorySource(
        authority=SourceAuthority.ACT,
        title="Income-tax Act, 2025",
        reference="Income-tax Act, 2025",
        source_url="https://www.incometax.gov.in/",
        published_on=date(2025, 8, 21),
    )


def test_rule_provenance_requires_authoritative_evidence() -> None:
    with pytest.raises(ValueError, match="authoritative source"):
        StatutoryRuleProvenance(
            rule_id="income_tax.example",
            rule_version="2026.1",
            act=IncomeTaxAct.ACT_2025,
            effective_from=date(2026, 4, 1),
            effective_to=None,
            sources=(),
        )


def test_rule_provenance_enforces_effective_date_range() -> None:
    with pytest.raises(ValueError, match="effective_to"):
        StatutoryRuleProvenance(
            rule_id="income_tax.example",
            rule_version="2026.1",
            act=IncomeTaxAct.ACT_2025,
            effective_from=date(2026, 4, 1),
            effective_to=date(2026, 3, 31),
            sources=(_source(),),
        )


def test_rule_provenance_resolves_applicability_and_evidence() -> None:
    provenance = StatutoryRuleProvenance(
        rule_id="income_tax.example",
        rule_version="2026.1",
        act=IncomeTaxAct.ACT_2025,
        effective_from=date(2026, 4, 1),
        effective_to=date(2027, 3, 31),
        sources=(_source(),),
    )

    assert not provenance.applies_on(date(2026, 3, 31))
    assert provenance.applies_on(date(2026, 4, 1))
    assert provenance.applies_on(date(2027, 3, 31))
    assert not provenance.applies_on(date(2027, 4, 1))
    assert provenance.evidence_refs == ("Income-tax Act, 2025",)


def test_source_rejects_non_https_evidence_url() -> None:
    with pytest.raises(ValueError, match="HTTPS"):
        StatutorySource(
            authority=SourceAuthority.OFFICIAL_GUIDANCE,
            title="Example",
            reference="Example reference",
            source_url="http://example.test/source",
        )
