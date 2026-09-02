from typing import Any

from tax_engine.ai.schemas import (
    PayrollExplanationContext,
    TaxToolResponse,
)
from tax_engine.payroll.employee import EmployeePayrollInput
from tax_engine.services.payroll_service import run_employee_payroll


def _extract_review_reasons(result: dict[str, Any]) -> list[str]:
    reasons: list[str] = []

    pt = result.get("pt_breakdown")
    if isinstance(pt, dict):
        reason = pt.get("review_reason")
        if reason:
            reasons.append(str(reason))

    tds = result.get("tds_breakdown")
    if isinstance(tds, dict):
        adjustment = tds.get("income_adjustment_breakdown")
        if isinstance(adjustment, dict):
            reason = adjustment.get("review_reason")
            if reason:
                reasons.append(str(reason))

    if (
        result.get("status") == "REVIEW_REQUIRED"
        and not reasons
    ):
        reasons.append(
            "One or more statutory components require review."
        )

    return reasons


def calculate_payroll_tool(
    employee: EmployeePayrollInput,
) -> TaxToolResponse:
    """
    AI-safe payroll calculation tool.

    All monetary calculations come exclusively from the
    deterministic payroll service.
    """

    result = run_employee_payroll(employee)

    summary = {
        "employee_id": result["employee_id"],
        "employee_name": result["employee_name"],
        "tax_year": result["tax_year"],
        "payroll_month": result["payroll_month"],
        "gross_salary": result["gross_salary"],
        "tds": result.get("tds"),
        "employee_pf": result.get("employee_pf"),
        "professional_tax": result.get("professional_tax"),
        "total_deductions": result.get("total_deductions"),
        "net_salary": result.get("net_salary"),
    }

    breakdowns = {
        "tds": result.get("tds_breakdown"),
        "pf": result.get("pf_breakdown"),
        "professional_tax": result.get("pt_breakdown"),
    }

    return TaxToolResponse(
        tool="calculate_payroll",
        status=result["status"],
        summary=summary,
        breakdowns=breakdowns,
        review_reasons=_extract_review_reasons(result),
    )


def build_payroll_explanation_context(
    employee: EmployeePayrollInput,
) -> PayrollExplanationContext:
    """
    Produce engine-grounded facts for an AI explanation.

    No tax calculation occurs in this function.
    """

    result = run_employee_payroll(employee)

    return PayrollExplanationContext(
        status=result["status"],
        employee_id=result["employee_id"],
        employee_name=result["employee_name"],
        tax_year=result["tax_year"],
        payroll_month=result["payroll_month"],
        gross_salary=result["gross_salary"],
        tds=result.get("tds"),
        employee_pf=result.get("employee_pf"),
        professional_tax=result.get("professional_tax"),
        total_deductions=result.get("total_deductions"),
        net_salary=result.get("net_salary"),
        tds_breakdown=result.get("tds_breakdown"),
        pf_breakdown=result.get("pf_breakdown"),
        pt_breakdown=result.get("pt_breakdown"),
    )
