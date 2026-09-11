from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError
from tax_engine.tds.health_insurance import (
    HealthInsuranceDeclaration,
    calculate_health_insurance_deduction,
)
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

    if employee.deduction_80d > ZERO:
        raise StatutoryRuleUnavailableError(
            "legacy aggregate deduction_80d cannot be safely interpreted; use structured Section 126 inputs"
        )

    health_declaration = HealthInsuranceDeclaration(
        self_family_premium=employee.health_insurance_self_family_premium,
        parents_premium=employee.health_insurance_parents_premium,
        self_family_preventive_checkup=employee.health_preventive_checkup_self_family,
        parents_preventive_checkup=employee.health_preventive_checkup_parents,
        self_family_medical_expenditure=employee.health_medical_expenditure_self_family,
        parents_medical_expenditure=employee.health_medical_expenditure_parents,
        self_family_has_senior_citizen=employee.health_self_family_has_senior_citizen,
        parents_have_senior_citizen=employee.health_parents_have_senior_citizen,
        self_family_premium_years_covered=employee.health_insurance_self_family_years_covered,
        parents_premium_years_covered=employee.health_insurance_parents_years_covered,
        self_family_premium_non_cash_verified=employee.health_insurance_self_family_non_cash_verified,
        parents_premium_non_cash_verified=employee.health_insurance_parents_non_cash_verified,
        self_family_medical_non_cash_verified=employee.health_medical_self_family_non_cash_verified,
        parents_medical_non_cash_verified=employee.health_medical_parents_non_cash_verified,
        evidence_verified=employee.health_insurance_evidence_verified,
    )
    health_insurance = calculate_health_insurance_deduction(
        declaration=health_declaration,
        tax_year=employee.tax_year,
        regime=regime,
    )
    deduction_health_insurance = health_insurance["allowed_deduction"]

    return {
        "standard_deduction": standard_deduction,
        "professional_tax": professional_tax,
        "deduction_123": deduction_123,
        "deduction_health_insurance": deduction_health_insurance,
    }
