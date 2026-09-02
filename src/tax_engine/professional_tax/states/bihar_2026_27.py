from decimal import Decimal

from tax_engine.professional_tax.declarative import (
    calculate_declarative_pt,
)
from tax_engine.professional_tax.models import (
    ProfessionalTaxResult,
    PTStatus,
)
from tax_engine.professional_tax.verified_schedules_2026_27 import (
    BIHAR_2026_27,
)


def calculate(
    *,
    monthly_salary_or_wages: Decimal,
    payroll_month: int,
    tax_year: str,
    sex=None,
    pt_half_year_salary_or_wages=None,
    pt_annual_salary_or_wages=None,
    pt_days_employed_in_half_year=None,
    pt_already_deducted_for_half_year=None,
    **kwargs,
) -> ProfessionalTaxResult:

    monthly_salary_or_wages = Decimal(
        monthly_salary_or_wages
    )

    if pt_annual_salary_or_wages is None:
        return ProfessionalTaxResult(
            state="bihar",
            tax_year=tax_year,
            payroll_month=payroll_month,
            monthly_salary_or_wages=monthly_salary_or_wages,
            professional_tax=Decimal("0"),
            status=PTStatus.REVIEW_REQUIRED,
            rule_reference=BIHAR_2026_27.source_reference,
            review_reason=(
                "Bihar Professional Tax requires authoritative "
                "annual income for slab determination."
            ),
        )

    amount = calculate_declarative_pt(
        rule=BIHAR_2026_27,
        annual_income=Decimal(
            pt_annual_salary_or_wages
        ),
    )

    return ProfessionalTaxResult(
        state="bihar",
        tax_year=tax_year,
        payroll_month=payroll_month,
        monthly_salary_or_wages=monthly_salary_or_wages,
        professional_tax=amount,
        status=PTStatus.CALCULATED,
        rule_reference=BIHAR_2026_27.source_reference,
        review_reason=None,
    )
