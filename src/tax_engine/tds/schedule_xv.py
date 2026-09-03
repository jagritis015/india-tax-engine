from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule

ZERO = Decimal("0")
SCHEDULE_XV_AGGREGATE_LIMIT = Decimal("150000")


def _tax_year_start(tax_year: str) -> date:
    try:
        start_year = int(tax_year.split("-", 1)[0])
    except (TypeError, ValueError, AttributeError) as exc:
        raise ValueError(f"invalid tax_year: {tax_year!r}") from exc
    return date(start_year, 4, 1)


def calculate_schedule_xv_deduction(
    qualifying_payments_total: Decimal,
    tax_year: str,
    regime: TaxRegime,
) -> dict[str, Decimal | str]:
    """Apply Section 123 aggregate cap and regime eligibility.

    ``qualifying_payments_total`` is intentionally an upstream-validated amount.
    This function does not decide whether an individual payment qualifies under
    a particular entry of Schedule XV. It only applies the verified aggregate
    limit and the section 202 new-regime exclusion.
    """
    if qualifying_payments_total < ZERO:
        raise ValueError("qualifying_payments_total cannot be negative")

    verified = get_verified_rule(
        "SCHEDULE_XV_DEDUCTION",
        on_date=_tax_year_start(tax_year),
    )
    if verified.rule.tax_year != tax_year:
        raise StatutoryRuleUnavailableError(
            "SCHEDULE_XV_DEDUCTION is not registered for tax year " + tax_year
        )

    if regime == TaxRegime.NEW:
        allowed = ZERO
        reason = "not_allowed_under_section_202_new_regime"
    elif regime == TaxRegime.OLD:
        allowed = min(qualifying_payments_total, SCHEDULE_XV_AGGREGATE_LIMIT)
        reason = "allowed_subject_to_section_123_aggregate_limit"
    else:
        raise ValueError(f"unsupported tax regime: {regime!r}")

    return {
        "tax_year": tax_year,
        "regime": regime.value,
        "qualifying_payments_total": qualifying_payments_total,
        "aggregate_limit": SCHEDULE_XV_AGGREGATE_LIMIT,
        "allowed_deduction": allowed,
        "disallowed_amount": qualifying_payments_total - allowed,
        "reason": reason,
        "input_scope": "upstream_validated_schedule_xv_qualifying_payments",
    }
