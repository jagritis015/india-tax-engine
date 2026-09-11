from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError
from tax_engine.tds.regime_resolver import resolve_tax_regime
from tax_engine.tds.regime_config import get_regime_config
from tax_engine.tds.schedule_xv import calculate_schedule_xv_deduction


ZERO = Decimal("0")


def calculate_eligible_deductions(
    employee: EmployeePayrollInput,
    projected_salary: Decimal,
) -> dict[str, Decimal]:
    """
    Resolve salary and Chapter VIII deductions for TY 2026-27.

    This V1 handles:
    - Standard deduction
    - Professional tax
    - Section 123 / Schedule XV deduction (legacy 80C concept)
    - Health insurance deduction input (legacy 80D concept)

    More deduction categories will be added as separate verified rules.
    Unsupported statutory deductions must fail closed instead of silently
    affecting taxable salary.
    """

    regime = resolve_tax_regime(employee)
    config = get_regime_config(employee.tax_year, regime)

    standard_deduction = min(
        config.STANDARD_DEDUCTION,
        projected_salary,
    )

    professional_tax = ZERO

    if regime == TaxRegime.OLD:
        professional_tax = employee.professional_tax_paid

    if (
        regime == TaxRegime.OLD
        and employee.deduction_80c > ZERO
        and not employee.tax_declaration_evidence_verified
    ):
        raise StatutoryRuleUnavailableError(
            "Schedule XV deduction requires upstream-verified qualifying-payment evidence"
        )

    schedule_xv = calculate_schedule_xv_deduction(
        qualifying_payments_total=employee.deduction_80c,
        tax_year=employee.tax_year,
        regime=regime,
    )
    deduction_123 = schedule_xv["allowed_deduction"]

    if regime == TaxRegime.OLD and employee.deduction_80d > ZERO:
        raise StatutoryRuleUnavailableError(
            "health-insurance deduction is not yet backed by a verified statutory rule"
        )

    deduction_health_insurance = ZERO

    return {
        "standard_deduction": standard_deduction,
        "professional_tax": professional_tax,
        "deduction_123": deduction_123,
        "deduction_health_insurance": deduction_health_insurance,
    }
