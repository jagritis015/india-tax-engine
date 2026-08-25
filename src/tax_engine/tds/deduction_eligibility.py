from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.tds.regime_resolver import resolve_tax_regime
from tax_engine.tds.regime_config import get_regime_config


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

    deduction_123 = ZERO
    deduction_health_insurance = ZERO

    if regime == TaxRegime.OLD:
        deduction_123 = min(
            employee.deduction_80c,
            Decimal("150000"),
        )

        deduction_health_insurance = employee.deduction_80d

    return {
        "standard_deduction": standard_deduction,
        "professional_tax": professional_tax,
        "deduction_123": deduction_123,
        "deduction_health_insurance": deduction_health_insurance,
    }
