from datetime import date

from tax_engine.statutory.law import IncomeTaxAct
from tax_engine.statutory.provenance import SourceAuthority, StatutoryRuleProvenance, StatutorySource
from tax_engine.statutory.rule_registry import StatutoryRule, VerificationStatus


_INCOME_TAX_ACT_2025_URL = "https://incometaxindia.gov.in/Documents/Act/Income-tax-Act-2025.pdf"
_FINANCE_ACT_2026_URL = "https://www.incometaxindia.gov.in/documents/d/guest/finance-act-2026-pdf-1"
_CBDT_INTERPLAY_FAQ_URL = "https://www.incometaxindia.gov.in/documents/81799/11848482/FAQs-on-Interplay-and-Transition.pdf/05f80c1a-073c-a5d7-fb6f-55509242be53"


def _act_source(reference: str) -> tuple[StatutorySource, ...]:
    return (StatutorySource(authority=SourceAuthority.ACT, title="Income-tax Act, 2025", reference=reference, source_url=_INCOME_TAX_ACT_2025_URL),)


def _finance_source(reference: str) -> tuple[StatutorySource, ...]:
    return (StatutorySource(authority=SourceAuthority.ACT, title="Finance Act, 2026", reference=reference, source_url=_FINANCE_ACT_2026_URL),)


def _schedule_xv_sources() -> tuple[StatutorySource, ...]:
    return (
        StatutorySource(
            authority=SourceAuthority.ACT,
            title="Income-tax Act, 2025",
            reference="Section 123 read with Schedule XV",
            source_url=_INCOME_TAX_ACT_2025_URL,
        ),
        StatutorySource(
            authority=SourceAuthority.OFFICIAL_GUIDANCE,
            title="CBDT FAQs on Interplay and Transition",
            reference="Q8.10-Q8.11",
            source_url=_CBDT_INTERPLAY_FAQ_URL,
        ),
    )


VERIFIED_RULE_PROVENANCE: dict[str, StatutoryRuleProvenance] = {
    "SALARY_TDS": StatutoryRuleProvenance("SALARY_TDS", "2026-27.1", IncomeTaxAct.ACT_2025, date(2026, 4, 1), None, _act_source("Section 392")),
    "NEW_REGIME_RATES": StatutoryRuleProvenance("NEW_REGIME_RATES", "2026-27.1", IncomeTaxAct.ACT_2025, date(2026, 4, 1), None, _act_source("Section 202")),
    "OLD_REGIME_RATES": StatutoryRuleProvenance("OLD_REGIME_RATES", "2026-27.1", IncomeTaxAct.ACT_2025, date(2026, 4, 1), date(2027, 3, 31), _finance_source("Section 3 read with Part I-B of the First Schedule")),
    "REBATE": StatutoryRuleProvenance("REBATE", "2026-27.1", IncomeTaxAct.ACT_2025, date(2026, 4, 1), None, _act_source("Sections 155 and 156")),
    "SCHEDULE_XV_DEDUCTION": StatutoryRuleProvenance("SCHEDULE_XV_DEDUCTION", "2026-27.1", IncomeTaxAct.ACT_2025, date(2026, 4, 1), None, _schedule_xv_sources()),
    "SURCHARGE": StatutoryRuleProvenance("SURCHARGE", "2026-27.1", IncomeTaxAct.ACT_2025, date(2026, 4, 1), date(2027, 3, 31), _finance_source("Section 3 read with Part I-B of the First Schedule")),
    "HEALTH_EDUCATION_CESS": StatutoryRuleProvenance("HEALTH_EDUCATION_CESS", "2026-27.1", IncomeTaxAct.ACT_2025, date(2026, 4, 1), date(2027, 3, 31), _finance_source("Health and Education Cess provisions for TY 2026-27")),
    "ROUNDING": StatutoryRuleProvenance("ROUNDING", "2026-27.1", IncomeTaxAct.ACT_2025, date(2026, 4, 1), None, _act_source("Section 516")),
}


def assert_verified_rule_has_authoritative_evidence(rule: StatutoryRule) -> None:
    """Fail closed if a registry rule is marked VERIFIED without evidence."""
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
