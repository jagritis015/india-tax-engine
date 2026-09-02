from decimal import Decimal

from tax_engine.professional_tax.declarative import (
    calculate_declarative_pt,
)
from tax_engine.professional_tax.models import (
    ProfessionalTaxResult,
    PTStatus,
)
from tax_engine.professional_tax.verified_schedules_2026_27 import (
    NAGALAND_2026_27,
)


def calculate(
    *,
    monthly_salary_or_wages: Decimal,
    payroll_month: int,
    tax_year: str,
    sex=None,
    pt_half_year_salary_or_wages=None,
    pt_days_employed_in_half_year=None,
    pt_already_deducted_for_half_year=None,
    pt_annual_salary_or_wages=None,
) -> ProfessionalTaxResult:
    """
    Nagaland employee Professional Tax for TY 2026-27.

    Uses the verified monthly Nagaland salary slab schedule.
    Extra PT context arguments are accepted to conform to the
    common Professional Tax handler interface.
    """

    monthly_salary_or_wages = Decimal(
        monthly_salary_or_wages
    )

    amount = calculate_declarative_pt(
        rule=NAGALAND_2026_27,
        monthly_income=monthly_salary_or_wages,
    )

    return ProfessionalTaxResult(
        state="nagaland",
        tax_year=tax_year,
        payroll_month=payroll_month,
        monthly_salary_or_wages=monthly_salary_or_wages,
        professional_tax=amount,
        status=PTStatus.CALCULATED,
        rule_reference=NAGALAND_2026_27.source_reference,
        review_reason=None,
    )
