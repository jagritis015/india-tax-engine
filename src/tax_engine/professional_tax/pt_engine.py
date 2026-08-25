from decimal import Decimal

from tax_engine.payroll.employee import Sex
from tax_engine.professional_tax.bootstrap import (
    register_professional_tax_rules,
)
from tax_engine.professional_tax.models import (
    ProfessionalTaxResult,
    PTStatus,
)
from tax_engine.professional_tax.registry import (
    get_pt_handler,
    is_pt_not_applicable,
)
from tax_engine.professional_tax.state_registry import normalize_state


_RULES_LOADED = False


def _ensure_rules_loaded() -> None:
    global _RULES_LOADED

    if not _RULES_LOADED:
        register_professional_tax_rules()
        _RULES_LOADED = True


def calculate_professional_tax(
    work_state: str,
    monthly_salary_or_wages: Decimal,
    payroll_month: int,
    tax_year: str,
    sex: Sex | None = None,
) -> ProfessionalTaxResult:

    if monthly_salary_or_wages < Decimal("0"):
        raise ValueError(
            "monthly_salary_or_wages cannot be negative"
        )

    if payroll_month < 1 or payroll_month > 12:
        raise ValueError(
            "payroll_month must be between 1 and 12"
        )

    _ensure_rules_loaded()

    state = normalize_state(work_state)

    handler = get_pt_handler(
        state=state,
        tax_year=tax_year,
    )

    if handler is not None:
        return handler(
            monthly_salary_or_wages=monthly_salary_or_wages,
            payroll_month=payroll_month,
            tax_year=tax_year,
            sex=sex,
        )

    if is_pt_not_applicable(
        state=state,
        tax_year=tax_year,
    ):
        return ProfessionalTaxResult(
            state=state,
            tax_year=tax_year,
            payroll_month=payroll_month,
            monthly_salary_or_wages=monthly_salary_or_wages,
            professional_tax=Decimal("0"),
            status=PTStatus.NOT_APPLICABLE,
            rule_reference="Verified as not applicable",
        )

    return ProfessionalTaxResult(
        state=state,
        tax_year=tax_year,
        payroll_month=payroll_month,
        monthly_salary_or_wages=monthly_salary_or_wages,
        professional_tax=Decimal("0"),
        status=PTStatus.REVIEW_REQUIRED,
        rule_reference=None,
    )
