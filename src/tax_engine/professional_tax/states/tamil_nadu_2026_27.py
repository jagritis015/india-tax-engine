from decimal import Decimal

from tax_engine.professional_tax.half_year_context import (
    PTHalfYearContext,
)
from tax_engine.professional_tax.models import (
    ProfessionalTaxResult,
    PTStatus,
)
from tax_engine.professional_tax.tamil_nadu import (
    calculate_tamil_nadu_pt,
)


def calculate(
    monthly_salary_or_wages: Decimal,
    payroll_month: int,
    tax_year: str,
    pt_half_year_salary_or_wages: Decimal | None = None,
    pt_days_employed_in_half_year: int | None = None,
    pt_already_deducted_for_half_year: Decimal = Decimal("0"),
    **kwargs,
) -> ProfessionalTaxResult:

    if (
        pt_half_year_salary_or_wages is None
        or pt_days_employed_in_half_year is None
    ):
        return ProfessionalTaxResult(
            state="tamil_nadu",
            tax_year=tax_year,
            payroll_month=payroll_month,
            monthly_salary_or_wages=monthly_salary_or_wages,
            professional_tax=Decimal("0"),
            status=PTStatus.REVIEW_REQUIRED,
            rule_reference=(
                "Tamil Nadu PT requires half-year salary/wage "
                "and days-employed context."
            ),
            review_reason=(
                "Tamil Nadu Professional Tax half-year context missing"
            ),
        )

    context = PTHalfYearContext(
        half_year_salary_or_wages=pt_half_year_salary_or_wages,
        days_employed_in_half_year=pt_days_employed_in_half_year,
        pt_already_deducted_for_half_year=(
            pt_already_deducted_for_half_year
        ),
    )

    professional_tax = calculate_tamil_nadu_pt(
        payroll_month=payroll_month,
        context=context,
    )

    return ProfessionalTaxResult(
        state="tamil_nadu",
        tax_year=tax_year,
        payroll_month=payroll_month,
        monthly_salary_or_wages=monthly_salary_or_wages,
        professional_tax=professional_tax,
        status=PTStatus.CALCULATED,
        rule_reference=(
            "Tamil Nadu Urban Local Bodies Rules, 2023 - "
            "half-year Professional Tax"
        ),
        review_reason=None,
    )
