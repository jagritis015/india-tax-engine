from decimal import Decimal

from tax_engine.professional_tax.models import (
    ProfessionalTaxResult,
    PTStatus,
)


THRESHOLD = Decimal("25000")
NORMAL_MONTHLY_PT = Decimal("200")
FEBRUARY_PT = Decimal("300")


def calculate(
    monthly_salary_or_wages: Decimal,
    payroll_month: int,
    tax_year: str,
    **kwargs,
) -> ProfessionalTaxResult:

    if monthly_salary_or_wages < THRESHOLD:
        professional_tax = Decimal("0")
    elif payroll_month == 2:
        professional_tax = FEBRUARY_PT
    else:
        professional_tax = NORMAL_MONTHLY_PT

    return ProfessionalTaxResult(
        state="karnataka",
        tax_year=tax_year,
        payroll_month=payroll_month,
        monthly_salary_or_wages=monthly_salary_or_wages,
        professional_tax=professional_tax,
        status=PTStatus.CALCULATED,
        rule_reference=(
            "Karnataka Tax on Professions, Trades, "
            "Callings and Employments Act - Schedule; "
            "amendment effective 01-04-2025"
        ),
    )
