from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule

ZERO = Decimal("0")
PREVENTIVE_CHECKUP_AGGREGATE_LIMIT = Decimal("5000")
STANDARD_GROUP_LIMIT = Decimal("25000")
SENIOR_CITIZEN_GROUP_LIMIT = Decimal("50000")
GROUP_OVERALL_LIMIT = Decimal("50000")


@dataclass(frozen=True)
class HealthInsuranceDeclaration:
    self_family_premium: Decimal = ZERO
    parents_premium: Decimal = ZERO
    self_family_preventive_checkup: Decimal = ZERO
    parents_preventive_checkup: Decimal = ZERO
    self_family_medical_expenditure: Decimal = ZERO
    parents_medical_expenditure: Decimal = ZERO
    self_family_has_senior_citizen: bool = False
    parents_have_senior_citizen: bool = False
    self_family_premium_years_covered: int = 1
    parents_premium_years_covered: int = 1
    self_family_premium_non_cash_verified: bool = False
    parents_premium_non_cash_verified: bool = False
    self_family_medical_non_cash_verified: bool = False
    parents_medical_non_cash_verified: bool = False
    evidence_verified: bool = False


def _tax_year_start(tax_year: str) -> date:
    try:
        start_year = int(tax_year.split("-", 1)[0])
    except (TypeError, ValueError, AttributeError) as exc:
        raise ValueError(f"invalid tax_year: {tax_year!r}") from exc
    return date(start_year, 4, 1)


def _require_non_negative(value: Decimal, name: str) -> None:
    if value < ZERO:
        raise ValueError(f"{name} cannot be negative")


def _annualised_premium(amount: Decimal, years_covered: int, name: str) -> Decimal:
    if years_covered < 1:
        raise ValueError(f"{name}_years_covered must be at least 1")
    return amount / Decimal(years_covered)


def calculate_health_insurance_deduction(
    declaration: HealthInsuranceDeclaration,
    tax_year: str,
    regime: TaxRegime,
) -> dict[str, Decimal | str]:
    """Apply Income-tax Act, 2025 section 126 for an individual.

    The model is intentionally conservative. Medical expenditure and health-insurance
    premium cannot both be claimed within the same aggregate person group because
    this payroll input does not yet identify each covered person separately.
    """
    verified = get_verified_rule("HEALTH_INSURANCE_DEDUCTION", on_date=_tax_year_start(tax_year))
    if verified.rule.tax_year != tax_year:
        raise StatutoryRuleUnavailableError(
            "HEALTH_INSURANCE_DEDUCTION is not registered for tax year " + tax_year
        )

    monetary_fields = {
        "self_family_premium": declaration.self_family_premium,
        "parents_premium": declaration.parents_premium,
        "self_family_preventive_checkup": declaration.self_family_preventive_checkup,
        "parents_preventive_checkup": declaration.parents_preventive_checkup,
        "self_family_medical_expenditure": declaration.self_family_medical_expenditure,
        "parents_medical_expenditure": declaration.parents_medical_expenditure,
    }
    for name, value in monetary_fields.items():
        _require_non_negative(value, name)

    any_claim = any(value > ZERO for value in monetary_fields.values())
    if any_claim and not declaration.evidence_verified:
        raise StatutoryRuleUnavailableError(
            "Section 126 deduction requires verified declaration evidence"
        )

    if regime == TaxRegime.NEW:
        return {
            "tax_year": tax_year,
            "regime": regime.value,
            "allowed_deduction": ZERO,
            "reason": "not_allowed_under_section_202_new_regime",
        }
    if regime != TaxRegime.OLD:
        raise ValueError(f"unsupported tax regime: {regime!r}")

    if declaration.self_family_premium > ZERO and not declaration.self_family_premium_non_cash_verified:
        raise StatutoryRuleUnavailableError("self/family health-insurance premium must be verified as non-cash")
    if declaration.parents_premium > ZERO and not declaration.parents_premium_non_cash_verified:
        raise StatutoryRuleUnavailableError("parents health-insurance premium must be verified as non-cash")
    if declaration.self_family_medical_expenditure > ZERO and not declaration.self_family_medical_non_cash_verified:
        raise StatutoryRuleUnavailableError("self/family medical expenditure must be verified as non-cash")
    if declaration.parents_medical_expenditure > ZERO and not declaration.parents_medical_non_cash_verified:
        raise StatutoryRuleUnavailableError("parents medical expenditure must be verified as non-cash")

    self_premium = _annualised_premium(
        declaration.self_family_premium,
        declaration.self_family_premium_years_covered,
        "self_family_premium",
    )
    parents_premium = _annualised_premium(
        declaration.parents_premium,
        declaration.parents_premium_years_covered,
        "parents_premium",
    )

    if declaration.self_family_medical_expenditure > ZERO:
        if not declaration.self_family_has_senior_citizen:
            raise StatutoryRuleUnavailableError(
                "self/family medical expenditure is deductible only for a senior citizen"
            )
        if self_premium > ZERO:
            raise StatutoryRuleUnavailableError(
                "self/family medical expenditure cannot be safely combined with aggregate premium data"
            )
    if declaration.parents_medical_expenditure > ZERO:
        if not declaration.parents_have_senior_citizen:
            raise StatutoryRuleUnavailableError(
                "parents medical expenditure is deductible only for a senior citizen"
            )
        if parents_premium > ZERO:
            raise StatutoryRuleUnavailableError(
                "parents medical expenditure cannot be safely combined with aggregate premium data"
            )

    self_a_limit = SENIOR_CITIZEN_GROUP_LIMIT if declaration.self_family_has_senior_citizen else STANDARD_GROUP_LIMIT
    parents_a_limit = SENIOR_CITIZEN_GROUP_LIMIT if declaration.parents_have_senior_citizen else STANDARD_GROUP_LIMIT

    self_premium_allowed = min(self_premium, self_a_limit)
    parents_premium_allowed = min(parents_premium, parents_a_limit)
    self_medical_allowed = min(declaration.self_family_medical_expenditure, GROUP_OVERALL_LIMIT)
    parents_medical_allowed = min(declaration.parents_medical_expenditure, GROUP_OVERALL_LIMIT)

    self_base = min(self_premium_allowed + self_medical_allowed, GROUP_OVERALL_LIMIT)
    parents_base = min(parents_premium_allowed + parents_medical_allowed, GROUP_OVERALL_LIMIT)

    self_checkup_capacity = min(
        max(ZERO, self_a_limit - self_premium_allowed),
        max(ZERO, GROUP_OVERALL_LIMIT - self_base),
    )
    parents_checkup_capacity = min(
        max(ZERO, parents_a_limit - parents_premium_allowed),
        max(ZERO, GROUP_OVERALL_LIMIT - parents_base),
    )
    checkup_eligible = (
        min(declaration.self_family_preventive_checkup, self_checkup_capacity)
        + min(declaration.parents_preventive_checkup, parents_checkup_capacity)
    )
    checkup_allowed = min(checkup_eligible, PREVENTIVE_CHECKUP_AGGREGATE_LIMIT)

    allowed = self_base + parents_base + checkup_allowed
    return {
        "tax_year": tax_year,
        "regime": regime.value,
        "self_family_base_allowed": self_base,
        "parents_base_allowed": parents_base,
        "preventive_checkup_allowed": checkup_allowed,
        "allowed_deduction": allowed,
        "reason": "allowed_under_section_126",
    }
