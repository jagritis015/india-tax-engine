from decimal import Decimal

from tax_engine.professional_tax.models import (
    ProfessionalTaxResult,
    PTStatus,
)


THRESHOLD = Decimal("12000")
MONTHLY_PT = Decimal("200")


def calculate(
    monthly_salary_or_wages: Decimal,
    payroll_month: int,
    tax_year: str,
    **kwargs,
) -> ProfessionalTaxResult:

    professional_tax = (
        MONTHLY_PT
        if monthly_salary_or_wages > THRESHOLD
        else Decimal("0")
    )

    return ProfessionalTaxResult(
        state="gujarat",
        tax_year=tax_year,
        payroll_month=payroll_month,
        monthly_salary_or_wages=monthly_salary_or_wages,
        professional_tax=professional_tax,
        status=PTStatus.CALCULATED,
        rule_reference=(
            "Gujarat State Tax on Professions, Trades, "
            "Callings and Employments Act, 1976 - Schedule"
        ),
    )
