from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput
from tax_engine.tds.annual_tax import calculate_annual_tax
from tax_engine.tds.income_adjustments import (
    calculate_declared_income_adjustments,
)
from tax_engine.tds.monthly_tds import calculate_monthly_tds
from tax_engine.tds.regime_resolver import resolve_tax_regime
from tax_engine.tds.salary_projection import (
    months_remaining_including_current,
    project_tax_year_salary,
)
from tax_engine.tds.taxable_salary import calculate_taxable_salary


ZERO = Decimal("0")


def calculate_employee_tds(
    employee: EmployeePayrollInput,
) -> dict:
    """
    End-to-end salary TDS computation for TY 2026-27.

    Section 392 flow:
    1. Resolve tax regime
    2. Project salary income
    3. Compute taxable salary
    4. Add declared other taxable income
    5. Apply verified house-property adjustment
    6. Calculate annual tax liability
    7. Credit valid prior TDS
    8. Allocate remaining liability across payroll months

    Evidence-sensitive inputs propagate REVIEW_REQUIRED.
    """

    regime = resolve_tax_regime(employee)

    projected_salary = project_tax_year_salary(employee)

    taxable_salary_result = calculate_taxable_salary(
        employee=employee,
        projected_salary=projected_salary,
    )

    adjustment_result = calculate_declared_income_adjustments(
        employee
    )

    estimated_total_income = (
        taxable_salary_result["taxable_salary"]
        + adjustment_result["other_income"]
        + adjustment_result["house_property_adjustment"]
    )

    estimated_total_income = max(
        ZERO,
        estimated_total_income,
    )

    annual_tax_result = calculate_annual_tax(
        taxable_income=estimated_total_income,
        tax_year=employee.tax_year,
        regime=regime,
        resident_individual=True,
    )

    remaining_months = months_remaining_including_current(
        employee.payroll_month
    )

    previous_employer_tds_credit = ZERO

    if employee.previous_employer_details_verified:
        previous_employer_tds_credit = (
            employee.previous_employer_tds
        )

    monthly_tds_result = calculate_monthly_tds(
        annual_tax_liability=annual_tax_result[
            "annual_tax_liability"
        ],
        tds_deducted_current_employer_ytd=(
            employee.tds_deducted_ytd
        ),
        previous_employer_tds=previous_employer_tds_credit,
        remaining_payroll_months=remaining_months,
    )

    status = (
        "REVIEW_REQUIRED"
        if adjustment_result["review_required"]
        else "CALCULATED"
    )

    return {
        "status": status,
        "employee_id": employee.employee_id,
        "employee_name": employee.employee_name,
        "tax_year": employee.tax_year,
        "regime": regime.value,

        "projected_salary": projected_salary,
        "taxable_salary": taxable_salary_result[
            "taxable_salary"
        ],

        "declared_other_income": adjustment_result[
            "other_income"
        ],
        "house_property_adjustment": adjustment_result[
            "house_property_adjustment"
        ],

        "estimated_total_income": estimated_total_income,

        "annual_tax_liability": annual_tax_result[
            "annual_tax_liability"
        ],

        "tds_deducted_ytd": employee.tds_deducted_ytd,
        "previous_employer_tds_credit": (
            previous_employer_tds_credit
        ),

        "remaining_payroll_months": remaining_months,
        "current_month_tds": monthly_tds_result[
            "current_month_tds"
        ],

        "income_adjustment_breakdown": adjustment_result,
        "taxable_salary_breakdown": taxable_salary_result,
        "annual_tax_breakdown": annual_tax_result,
        "monthly_tds_breakdown": monthly_tds_result,
    }
