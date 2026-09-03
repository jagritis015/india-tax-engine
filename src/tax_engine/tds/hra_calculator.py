from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError, get_verified_rule
from tax_engine.tds.regime_resolver import resolve_tax_regime


ZERO = Decimal("0")

FIFTY_PERCENT_LOCATIONS = {
    "mumbai",
    "kolkata",
    "delhi",
    "chennai",
    "hyderabad",
    "pune",
    "ahmedabad",
    "bengaluru",
    "bangalore",
}


def _tax_year_start(tax_year: str) -> date:
    try:
        start_year = int(tax_year.split("-", 1)[0])
    except (TypeError, ValueError, AttributeError) as exc:
        raise ValueError(f"invalid tax_year: {tax_year!r}") from exc
    return date(start_year, 4, 1)


def calculate_hra_exemption(
    employee: EmployeePayrollInput,
    projected_basic_salary: Decimal,
    projected_da: Decimal,
    projected_hra: Decimal,
) -> Decimal:
    """Calculate TY 2026-27 HRA exemption under Schedule III and Rule 279."""

    verified = get_verified_rule(
        "HRA_EXEMPTION",
        on_date=_tax_year_start(employee.tax_year),
    )
    if verified.rule.tax_year != employee.tax_year:
        raise StatutoryRuleUnavailableError(
            f"HRA exemption is not registered for tax year {employee.tax_year}"
        )

    regime = resolve_tax_regime(employee)

    # Section 202(2)(a)(i) excludes Schedule III Table Sl. No. 11
    # when computing total income under the new regime.
    if regime != TaxRegime.OLD:
        return ZERO

    if employee.annual_rent_paid <= ZERO:
        return ZERO

    if not employee.hra_location:
        return ZERO

    hra_salary = projected_basic_salary

    # Rule 279 includes DA where the terms of employment so provide.
    if employee.da_forms_part_of_retirement_benefits:
        hra_salary += projected_da

    location = employee.hra_location.strip().lower()

    percentage = (
        Decimal("0.50")
        if location in FIFTY_PERCENT_LOCATIONS
        else Decimal("0.40")
    )

    actual_hra = projected_hra
    rent_minus_10_percent_salary = max(
        ZERO,
        employee.annual_rent_paid - (hra_salary * Decimal("0.10")),
    )
    salary_percentage_limit = hra_salary * percentage

    return min(
        actual_hra,
        rent_minus_10_percent_salary,
        salary_percentage_limit,
    )
