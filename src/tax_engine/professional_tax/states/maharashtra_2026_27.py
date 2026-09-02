from decimal import Decimal

from tax_engine.payroll.employee import Sex
from tax_engine.professional_tax.models import (
    ProfessionalTaxResult,
    PTStatus,
)


def calculate(
    monthly_salary_or_wages: Decimal,
    payroll_month: int,
    tax_year: str,
    sex=None,
    pt_half_year_salary_or_wages=None,
    pt_days_employed_in_half_year=None,
    pt_already_deducted_for_half_year=None,
    pt_annual_salary_or_wages=None,
    **kwargs,
) -> ProfessionalTaxResult:

    if sex is None or sex == Sex.OTHER:
        return ProfessionalTaxResult(
            state="maharashtra",
            tax_year=tax_year,
            payroll_month=payroll_month,
            monthly_salary_or_wages=monthly_salary_or_wages,
            professional_tax=Decimal("0"),
            status=PTStatus.REVIEW_REQUIRED,
            rule_reference=(
                "Maharashtra PT Schedule requires sex-specific "
                "salary classification"
            ),
        )

    if sex == Sex.MALE:
        if monthly_salary_or_wages <= Decimal("7500"):
            professional_tax = Decimal("0")
        elif monthly_salary_or_wages <= Decimal("10000"):
            professional_tax = Decimal("175")
        else:
            professional_tax = (
                Decimal("300")
                if payroll_month == 2
                else Decimal("200")
            )

    else:
        if monthly_salary_or_wages <= Decimal("25000"):
            professional_tax = Decimal("0")
        else:
            professional_tax = (
                Decimal("300")
                if payroll_month == 2
                else Decimal("200")
            )

    return ProfessionalTaxResult(
        state="maharashtra",
        tax_year=tax_year,
        payroll_month=payroll_month,
        monthly_salary_or_wages=monthly_salary_or_wages,
        professional_tax=professional_tax,
        status=PTStatus.CALCULATED,
        rule_reference=(
            "Maharashtra State Tax on Professions, Trades, "
            "Callings and Employments Act, 1975 - Schedule"
        ),
    )
