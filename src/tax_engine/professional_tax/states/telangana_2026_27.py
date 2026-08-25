from decimal import Decimal

from tax_engine.professional_tax.models import (
    ProfessionalTaxResult,
    PTStatus,
)


def calculate(
    monthly_salary_or_wages: Decimal,
    payroll_month: int,
    tax_year: str,
    **kwargs,
) -> ProfessionalTaxResult:

    if monthly_salary_or_wages <= Decimal("15000"):
        professional_tax = Decimal("0")

    elif monthly_salary_or_wages <= Decimal("20000"):
        professional_tax = Decimal("150")

    else:
        professional_tax = Decimal("200")

    return ProfessionalTaxResult(
        state="telangana",
        tax_year=tax_year,
        payroll_month=payroll_month,
        monthly_salary_or_wages=monthly_salary_or_wages,
        professional_tax=professional_tax,
        status=PTStatus.CALCULATED,
        rule_reference=(
            "Telangana Tax on Professions, Trades, "
            "Callings and Employments Act, 1987 - First Schedule"
        ),
    )
