from decimal import Decimal

import pytest

from tax_engine.payroll.employee import TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule
from tax_engine.tds.salary_deductions import (
    calculate_professional_tax_salary_deduction,
    calculate_standard_deduction,
)


def test_standard_deduction_rule_is_verified_for_ty_2026_27():
    verified = get_verified_rule(
        "STANDARD_DEDUCTION",
        on_date=__import__("datetime").date(2026, 4, 1),
    )
    assert "Section 19" in verified.rule.provision
    assert verified.provenance.sources


def test_new_regime_standard_deduction_is_75000_or_salary_if_lower():
    assert calculate_standard_deduction(
        Decimal("1500000"), "2026-27", TaxRegime.NEW
    ) == Decimal("75000")
    assert calculate_standard_deduction(
        Decimal("50000"), "2026-27", TaxRegime.NEW
    ) == Decimal("50000")


def test_old_regime_standard_deduction_is_50000_or_salary_if_lower():
    assert calculate_standard_deduction(
        Decimal("1500000"), "2026-27", TaxRegime.OLD
    ) == Decimal("50000")
    assert calculate_standard_deduction(
        Decimal("30000"), "2026-27", TaxRegime.OLD
    ) == Decimal("30000")


def test_professional_tax_salary_deduction_rule_is_verified():
    verified = get_verified_rule(
        "PROFESSIONAL_TAX_SALARY_DEDUCTION",
        on_date=__import__("datetime").date(2026, 4, 1),
    )
    assert "202(2)(a)(iv)" in verified.rule.provision
    assert verified.provenance.sources


def test_professional_tax_is_deductible_in_old_regime_and_disallowed_in_new():
    paid = Decimal("2400")
    assert calculate_professional_tax_salary_deduction(
        paid, "2026-27", TaxRegime.OLD
    ) == paid
    assert calculate_professional_tax_salary_deduction(
        paid, "2026-27", TaxRegime.NEW
    ) == Decimal("0")


def test_section_19_salary_deductions_fail_closed_for_unregistered_future_year():
    with pytest.raises(StatutoryRuleUnavailableError):
        calculate_standard_deduction(Decimal("100000"), "2027-28", TaxRegime.NEW)
    with pytest.raises(StatutoryRuleUnavailableError):
        calculate_professional_tax_salary_deduction(
            Decimal("2400"), "2027-28", TaxRegime.OLD
        )
