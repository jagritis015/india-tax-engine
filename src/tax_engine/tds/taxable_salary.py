from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput
from tax_engine.tds.deduction_eligibility import calculate_eligible_deductions
from tax_engine.tds.hra_calculator import calculate_hra_exemption
from tax_engine.tds.regime_resolver import resolve_tax_regime
from tax_engine.tds.salary_projection import project_component


ZERO = Decimal("0")


def calculate_taxable_salary(
    employee: EmployeePayrollInput,
    projected_salary: Decimal,
) -> dict[str, Decimal | str]:
    """
    Calculate V1 taxable salary for TY 2026-27.
    """

    if projected_salary < ZERO:
        raise ValueError("projected_salary cannot be negative")

    regime = resolve_tax_regime(employee)

    projected_basic = project_component(
        employee.basic_salary_ytd,
        employee.basic_salary,
        employee.payroll_month,
    )

    projected_da = project_component(
        employee.dearness_allowance_ytd,
        employee.dearness_allowance,
        employee.payroll_month,
    )

    projected_hra = project_component(
        employee.hra_ytd,
        employee.hra,
        employee.payroll_month,
    )

    hra_exemption = calculate_hra_exemption(
        employee=employee,
        projected_basic_salary=projected_basic,
        projected_da=projected_da,
        projected_hra=projected_hra,
    )

    salary_after_exemptions = max(
        ZERO,
        projected_salary - hra_exemption,
    )

    deductions = calculate_eligible_deductions(
        employee=employee,
        projected_salary=salary_after_exemptions,
    )

    salary_after_section_19 = max(
        ZERO,
        salary_after_exemptions
        - deductions["standard_deduction"]
        - deductions["professional_tax"],
    )

    chapter_viii_deductions = (
        deductions["deduction_123"]
        + deductions["deduction_health_insurance"]
    )

    taxable_salary = max(
        ZERO,
        salary_after_section_19 - chapter_viii_deductions,
    )

    return {
        "regime": regime.value,
        "projected_salary": projected_salary,
        "projected_basic": projected_basic,
        "projected_da": projected_da,
        "projected_hra": projected_hra,
        "hra_exemption": hra_exemption,
        "salary_after_exemptions": salary_after_exemptions,
        "standard_deduction": deductions["standard_deduction"],
        "professional_tax": deductions["professional_tax"],
        "deduction_123": deductions["deduction_123"],
        "deduction_health_insurance": deductions[
            "deduction_health_insurance"
        ],
        "salary_after_section_19": salary_after_section_19,
        "chapter_viii_deductions": chapter_viii_deductions,
        "taxable_salary": taxable_salary,
    }
