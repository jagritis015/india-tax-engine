from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule


ZERO = Decimal("0")
ALLOCATION_POLICY = "EVEN_REMAINING_PAYROLL_MONTHS"


def _tax_year_start(tax_year: str) -> date:
    try:
        start_year = int(tax_year.split("-", 1)[0])
    except (TypeError, ValueError, AttributeError) as exc:
        raise ValueError(f"invalid tax_year: {tax_year!r}") from exc
    return date(start_year, 4, 1)


def _assert_salary_tds_rule_verified(tax_year: str) -> None:
    """Fail closed unless salary TDS law is verified for the requested tax year."""
    verified = get_verified_rule("SALARY_TDS", on_date=_tax_year_start(tax_year))
    if verified.rule.tax_year != tax_year:
        raise StatutoryRuleUnavailableError(
            f"statutory rule SALARY_TDS is not registered for tax year {tax_year}"
        )


def calculate_monthly_tds(
    annual_tax_liability: Decimal,
    tds_deducted_current_employer_ytd: Decimal,
    previous_employer_tds: Decimal,
    remaining_payroll_months: int,
    tax_year: str,
) -> dict[str, Decimal | int | str]:
    """Allocate remaining salary TDS after validating the governing rule.

    Section 392 governs salary TDS and permits adjustment for tax already
    deducted and other employer information. Equal allocation across remaining
    payroll months is an engine policy, not a claim that the Act mandates equal
    monthly instalments. The final payroll month absorbs the exact residual.
    """

    _assert_salary_tds_rule_verified(tax_year)

    if annual_tax_liability < ZERO:
        raise ValueError("annual_tax_liability cannot be negative")

    if tds_deducted_current_employer_ytd < ZERO:
        raise ValueError("tds_deducted_current_employer_ytd cannot be negative")

    if previous_employer_tds < ZERO:
        raise ValueError("previous_employer_tds cannot be negative")

    if remaining_payroll_months <= 0:
        raise ValueError("remaining_payroll_months must be greater than zero")

    total_tds_credit_considered = (
        tds_deducted_current_employer_ytd + previous_employer_tds
    )

    remaining_tax = max(
        ZERO,
        annual_tax_liability - total_tds_credit_considered,
    )

    if remaining_payroll_months == 1:
        current_month_tds = remaining_tax
    else:
        current_month_tds = (
            remaining_tax / Decimal(remaining_payroll_months)
        ).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    return {
        "tax_year": tax_year,
        "statutory_rule_id": "SALARY_TDS",
        "allocation_policy": ALLOCATION_POLICY,
        "annual_tax_liability": annual_tax_liability,
        "tds_deducted_current_employer_ytd": tds_deducted_current_employer_ytd,
        "previous_employer_tds": previous_employer_tds,
        "total_tds_credit_considered": total_tds_credit_considered,
        "remaining_tax": remaining_tax,
        "remaining_payroll_months": remaining_payroll_months,
        "current_month_tds": current_month_tds,
    }
