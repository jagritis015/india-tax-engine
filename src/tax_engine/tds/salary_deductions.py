from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule

ZERO = Decimal("0")
NEW_REGIME_STANDARD_DEDUCTION = Decimal("75000")
OLD_REGIME_STANDARD_DEDUCTION = Decimal("50000")


def _tax_year_start(tax_year: str) -> date:
    try:
        start_year = int(tax_year.split("-", 1)[0])
    except (TypeError, ValueError, AttributeError) as exc:
        raise ValueError(f"invalid tax_year: {tax_year!r}") from exc
    return date(start_year, 4, 1)


def _resolve_verified_rule(rule_id: str, tax_year: str):
    verified = get_verified_rule(rule_id, on_date=_tax_year_start(tax_year))
    if verified.rule.tax_year != tax_year:
        raise StatutoryRuleUnavailableError(
            f"{rule_id} is not registered for tax year {tax_year}"
        )
    return verified


def calculate_standard_deduction(
    salary: Decimal,
    tax_year: str,
    regime: TaxRegime,
) -> Decimal:
    """Apply Income-tax Act, 2025 section 19(1), Table Sl. No. 2."""
    if salary < ZERO:
        raise ValueError("salary cannot be negative")
    _resolve_verified_rule("STANDARD_DEDUCTION", tax_year)

    if regime == TaxRegime.NEW:
        limit = NEW_REGIME_STANDARD_DEDUCTION
    elif regime == TaxRegime.OLD:
        limit = OLD_REGIME_STANDARD_DEDUCTION
    else:
        raise ValueError(f"unsupported tax regime: {regime!r}")

    return min(limit, salary)


def calculate_professional_tax_salary_deduction(
    professional_tax_paid: Decimal,
    tax_year: str,
    regime: TaxRegime,
) -> Decimal:
    """Apply section 19(1) Sl. No. 1 and section 202(2)(a)(iv)."""
    if professional_tax_paid < ZERO:
        raise ValueError("professional_tax_paid cannot be negative")
    _resolve_verified_rule("PROFESSIONAL_TAX_SALARY_DEDUCTION", tax_year)

    if regime == TaxRegime.NEW:
        return ZERO
    if regime == TaxRegime.OLD:
        return professional_tax_paid
    raise ValueError(f"unsupported tax regime: {regime!r}")
