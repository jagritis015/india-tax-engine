from datetime import date

from tax_engine.statutory.law import IncomeTaxAct, income_tax_law_context


def test_period_before_april_2026_remains_under_1961_act():
    context = income_tax_law_context(date(2025, 4, 1))

    assert context.act is IncomeTaxAct.ACT_1961
    assert context.period_label == "2025-26"
    assert context.assessment_year == "2026-27"


def test_tax_year_2026_27_uses_2025_act_without_assessment_year():
    context = income_tax_law_context(date(2026, 4, 1))

    assert context.act is IncomeTaxAct.ACT_2025
    assert context.tax_year == "2026-27"
    assert context.assessment_year is None


def test_date_within_tax_year_resolves_to_april_start():
    context = income_tax_law_context(date(2026, 9, 3))

    assert context.act is IncomeTaxAct.ACT_2025
    assert context.period_start == date(2026, 4, 1)
    assert context.period_end == date(2027, 3, 31)
    assert context.tax_year == "2026-27"
