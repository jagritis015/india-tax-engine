from decimal import Decimal

import pytest

from tax_engine.payroll.employee import TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule
from tax_engine.tds.health_insurance import (
    HealthInsuranceDeclaration,
    calculate_health_insurance_deduction,
)


def test_section_126_rule_is_verified_for_ty_2026_27():
    result = get_verified_rule(
        "HEALTH_INSURANCE_DEDUCTION",
        on_date=__import__("datetime").date(2026, 4, 1),
    )
    assert result.rule.tax_year == "2026-27"
    assert "Section 126" in result.rule.provision
    assert result.provenance.sources


def test_old_regime_allows_standard_self_family_and_parent_premiums():
    declaration = HealthInsuranceDeclaration(
        self_family_premium=Decimal("25000"),
        parents_premium=Decimal("25000"),
        self_family_premium_non_cash_verified=True,
        parents_premium_non_cash_verified=True,
        evidence_verified=True,
    )
    result = calculate_health_insurance_deduction(declaration, "2026-27", TaxRegime.OLD)
    assert result["allowed_deduction"] == Decimal("50000")


def test_senior_citizen_parent_limit_is_50000():
    declaration = HealthInsuranceDeclaration(
        parents_premium=Decimal("62000"),
        parents_have_senior_citizen=True,
        parents_premium_non_cash_verified=True,
        evidence_verified=True,
    )
    result = calculate_health_insurance_deduction(declaration, "2026-27", TaxRegime.OLD)
    assert result["allowed_deduction"] == Decimal("50000")


def test_preventive_checkup_is_capped_at_5000_in_aggregate():
    declaration = HealthInsuranceDeclaration(
        self_family_preventive_checkup=Decimal("4000"),
        parents_preventive_checkup=Decimal("4000"),
        evidence_verified=True,
    )
    result = calculate_health_insurance_deduction(declaration, "2026-27", TaxRegime.OLD)
    assert result["preventive_checkup_allowed"] == Decimal("5000")
    assert result["allowed_deduction"] == Decimal("5000")


def test_senior_citizen_medical_expenditure_allowed_without_insurance():
    declaration = HealthInsuranceDeclaration(
        parents_medical_expenditure=Decimal("70000"),
        parents_have_senior_citizen=True,
        parents_medical_non_cash_verified=True,
        evidence_verified=True,
    )
    result = calculate_health_insurance_deduction(declaration, "2026-27", TaxRegime.OLD)
    assert result["allowed_deduction"] == Decimal("50000")


def test_medical_expenditure_fails_closed_when_group_has_insurance_premium():
    declaration = HealthInsuranceDeclaration(
        parents_premium=Decimal("20000"),
        parents_medical_expenditure=Decimal("20000"),
        parents_have_senior_citizen=True,
        parents_premium_non_cash_verified=True,
        parents_medical_non_cash_verified=True,
        evidence_verified=True,
    )
    with pytest.raises(StatutoryRuleUnavailableError, match="cannot be safely combined"):
        calculate_health_insurance_deduction(declaration, "2026-27", TaxRegime.OLD)


def test_non_checkup_payment_must_be_verified_non_cash():
    declaration = HealthInsuranceDeclaration(
        self_family_premium=Decimal("10000"),
        evidence_verified=True,
    )
    with pytest.raises(StatutoryRuleUnavailableError, match="non-cash"):
        calculate_health_insurance_deduction(declaration, "2026-27", TaxRegime.OLD)


def test_multi_year_premium_is_allocated_by_relevant_tax_years():
    declaration = HealthInsuranceDeclaration(
        self_family_premium=Decimal("60000"),
        self_family_premium_years_covered=3,
        self_family_premium_non_cash_verified=True,
        evidence_verified=True,
    )
    result = calculate_health_insurance_deduction(declaration, "2026-27", TaxRegime.OLD)
    assert result["allowed_deduction"] == Decimal("20000")


def test_new_regime_disallows_section_126_deduction():
    declaration = HealthInsuranceDeclaration(
        self_family_premium=Decimal("25000"),
        self_family_premium_non_cash_verified=True,
        evidence_verified=True,
    )
    result = calculate_health_insurance_deduction(declaration, "2026-27", TaxRegime.NEW)
    assert result["allowed_deduction"] == Decimal("0")
    assert result["reason"] == "not_allowed_under_section_202_new_regime"


def test_unregistered_future_tax_year_fails_closed():
    with pytest.raises(StatutoryRuleUnavailableError):
        calculate_health_insurance_deduction(
            HealthInsuranceDeclaration(),
            "2027-28",
            TaxRegime.OLD,
        )
