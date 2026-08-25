from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
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


def calculate_hra_exemption(
    employee: EmployeePayrollInput,
    projected_basic_salary: Decimal,
    projected_da: Decimal,
    projected_hra: Decimal,
) -> Decimal:
    """
    Calculate HRA exemption for TY 2026-27.

    Exemption is available only when the employee
    is using the old regime in this V1.

    Rule 279 basis:
    least of:
    1. actual HRA
    2. rent paid minus 10% of salary
    3. 50% or 40% of salary depending on location
    """

    regime = resolve_tax_regime(employee)

    if regime != TaxRegime.OLD:
        return ZERO

    if employee.annual_rent_paid <= ZERO:
        return ZERO

    if not employee.hra_location:
        return ZERO

    hra_salary = projected_basic_salary

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
        employee.annual_rent_paid
        - (hra_salary * Decimal("0.10")),
    )

    salary_percentage_limit = hra_salary * percentage

    return min(
        actual_hra,
        rent_minus_10_percent_salary,
        salary_percentage_limit,
    )
