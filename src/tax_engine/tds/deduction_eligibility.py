from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError
from tax_engine.tds.regime_resolver import resolve_tax_regime
from tax_engine.tds.salary_deductions import (
    calculate_professional_tax_salary_deduction,
    calculate_standard_deduction,
)
from tax_engine.tds.schedule_xv import calculate_schedule_xv_deduction


ZERO = Decimal("0")


def calculate_eligible_deductions(
    employee: EmployeePayrollInput,
    projected_salary: Decimal,
) -> dict[str, Decimal]:
    """Resolve verified salary and Chapter VIII deductions for TY 2026-27."""

    regime = resolve_tax_regime(employee)

    standard_deduction = calculate_standard_deduction(
        salary=projected_salary,
        tax_year=employee.tax_year,
        regime=regime,
    )
    professional_tax = calculate_professional_tax_salary_deduction(
        professional_tax_paid=employee.professional_tax_paid,
        tax_year=employee.tax_year,
        regime=regime,
    )

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
