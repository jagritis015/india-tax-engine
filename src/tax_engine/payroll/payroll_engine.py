from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput
from tax_engine.payroll.payroll_result import PayrollResult
from tax_engine.pf.pf_calculator import calculate_employee_pf
from tax_engine.pf.pf_resolver import (
    resolve_higher_wage_contribution,
    resolve_pf_applicability,
)
from tax_engine.professional_tax.models import PTStatus
from tax_engine.professional_tax.pt_engine import (
    calculate_professional_tax,
)
from tax_engine.tds.salary_projection import current_month_gross
from tax_engine.tds.tds_engine import calculate_employee_tds


ZERO = Decimal("0")


def calculate_monthly_payroll(
    employee: EmployeePayrollInput,
) -> dict:
    """
    Combined monthly statutory payroll engine.

    Calculates:
    - Salary TDS
    - Employee PF
    - Professional Tax
    - Total statutory deductions
    - Net salary

    If a required statutory component cannot be determined,
    status becomes REVIEW_REQUIRED and final net salary is
    intentionally not produced.
    """

    gross_salary = current_month_gross(employee)

    # -------------------------
    # Salary TDS
    # -------------------------
    tds_result = calculate_employee_tds(employee)
    monthly_tds = tds_result["current_month_tds"]

    tds_review_required = (
        tds_result.get("status") == "REVIEW_REQUIRED"
    )

    # -------------------------
    # Employee PF
    # -------------------------
    pf_applicability = resolve_pf_applicability(employee)
    higher_wage_result = resolve_higher_wage_contribution(employee)

    pf_review_required = (
        pf_applicability["review_required"]
        or higher_wage_result["review_required"]
    )

    pf_result = None
    employee_pf = ZERO

    if not pf_review_required:
        pf_is_applicable = pf_applicability["pf_applicable"]

        if pf_is_applicable:
            if employee.pf_wages is None:
                pf_review_required = True
            else:
                pf_result = calculate_employee_pf(
                    pf_wages=employee.pf_wages,
                    pf_applicable=True,
                    contribution_rate=employee.pf_contribution_rate,
                    contribute_on_higher_wages=(
                        higher_wage_result["allowed"]
                    ),
                    international_worker=employee.international_worker,
                )

                employee_pf = pf_result["employee_pf"]

        else:
            pf_result = calculate_employee_pf(
                pf_wages=ZERO,
                pf_applicable=False,
            )

    # -------------------------
    # Professional Tax
    # -------------------------
    pt_result = calculate_professional_tax(
        work_state=employee.work_state,
        monthly_salary_or_wages=gross_salary,
        payroll_month=employee.payroll_month,
        tax_year=employee.tax_year,
        sex=employee.sex,
    )

    pt_review_required = (
        pt_result.status == PTStatus.REVIEW_REQUIRED
    )

    # -------------------------
    # Overall status
    # -------------------------
    review_required = (
        tds_review_required
        or pf_review_required
        or pt_review_required
    )

    if review_required:
        result = PayrollResult(
            status="REVIEW_REQUIRED",
            employee_id=employee.employee_id,
            employee_name=employee.employee_name,
            tax_year=employee.tax_year,
            payroll_month=employee.payroll_month,
            gross_salary=gross_salary,
            tds=monthly_tds,
            employee_pf=(
                None if pf_review_required else employee_pf
            ),
            professional_tax=(
                None if pt_review_required
                else pt_result.professional_tax
            ),
            total_deductions=None,
            net_salary=None,
            tds_breakdown=tds_result,
            pf_breakdown=pf_result,
            pt_breakdown=(
                pt_result.model_dump()
                if hasattr(pt_result, "model_dump")
                else pt_result
            ),
        )

        return result.model_dump()

    professional_tax = pt_result.professional_tax

    total_deductions = (
        monthly_tds
        + employee_pf
        + professional_tax
    )

    net_salary = gross_salary - total_deductions

    result = PayrollResult(
        status="CALCULATED",
        employee_id=employee.employee_id,
        employee_name=employee.employee_name,
        tax_year=employee.tax_year,
        payroll_month=employee.payroll_month,
        gross_salary=gross_salary,
        tds=monthly_tds,
        employee_pf=employee_pf,
        professional_tax=professional_tax,
        total_deductions=total_deductions,
        net_salary=net_salary,
        tds_breakdown=tds_result,
        pf_breakdown=pf_result,
        pt_breakdown=(
            pt_result.model_dump()
            if hasattr(pt_result, "model_dump")
            else pt_result
        ),
    )

    return result.model_dump()
