from decimal import Decimal
from typing import Iterable

from pydantic import BaseModel, Field

from tax_engine.ai.compliance import (
    ComplianceIssue,
    EmployeeComplianceResult,
    evaluate_employee_compliance,
)
from tax_engine.payroll.employee import EmployeePayrollInput


ZERO = Decimal("0")


class MonthlyComplianceTotals(BaseModel):
    gross_salary: Decimal = ZERO
    tds: Decimal = ZERO
    employee_pf: Decimal = ZERO
    professional_tax: Decimal = ZERO
    total_deductions: Decimal = ZERO
    net_salary: Decimal = ZERO


class MonthlyComplianceRun(BaseModel):
    tax_year: str
    payroll_month: int

    employees_processed: int
    ready_for_payroll: int
    review_required: int
    blocked: int

    readiness_percentage: Decimal

    totals: MonthlyComplianceTotals

    employee_results: list[EmployeeComplianceResult] = Field(
        default_factory=list
    )

    issues: list[ComplianceIssue] = Field(default_factory=list)

    payroll_can_be_approved: bool


def _money(value) -> Decimal:
    if value is None:
        return ZERO
    return Decimal(str(value))


def evaluate_monthly_compliance(
    employees: Iterable[EmployeePayrollInput],
) -> MonthlyComplianceRun:
    """
    Company-level monthly compliance evaluation.

    All statutory amounts originate from employee-level deterministic
    payroll calculations. This layer only aggregates results.
    """

    employee_list = list(employees)

    if not employee_list:
        raise ValueError("At least one employee is required")

    tax_year = employee_list[0].tax_year
    payroll_month = employee_list[0].payroll_month

    for employee in employee_list:
        if employee.tax_year != tax_year:
            raise ValueError(
                "All employees must belong to the same tax year"
            )

        if employee.payroll_month != payroll_month:
            raise ValueError(
                "All employees must belong to the same payroll month"
            )

    results = [
        evaluate_employee_compliance(employee)
        for employee in employee_list
    ]

    ready = sum(
        1 for result in results
        if result.ready_for_payroll
    )

    review = sum(
        1 for result in results
        if result.payroll_status == "REVIEW_REQUIRED"
    )

    blocked = sum(
        1 for result in results
        if result.payroll_status == "BLOCKED"
    )

    totals = MonthlyComplianceTotals()

    all_issues: list[ComplianceIssue] = []

    for result in results:
        summary = result.payroll_summary

        totals.gross_salary += _money(
            summary.get("gross_salary")
        )

        totals.tds += _money(
            summary.get("tds")
        )

        totals.employee_pf += _money(
            summary.get("employee_pf")
        )

        totals.professional_tax += _money(
            summary.get("professional_tax")
        )

        # These amounts only exist when the deterministic engine
        # has completed the full payroll result.
        totals.total_deductions += _money(
            summary.get("total_deductions")
        )

        totals.net_salary += _money(
            summary.get("net_salary")
        )

        all_issues.extend(result.issues)

    processed = len(results)

    readiness_percentage = (
        Decimal(ready)
        / Decimal(processed)
        * Decimal("100")
    ).quantize(Decimal("0.01"))

    payroll_can_be_approved = (
        ready == processed
        and review == 0
        and blocked == 0
    )

    return MonthlyComplianceRun(
        tax_year=tax_year,
        payroll_month=payroll_month,
        employees_processed=processed,
        ready_for_payroll=ready,
        review_required=review,
        blocked=blocked,
        readiness_percentage=readiness_percentage,
        totals=totals,
        employee_results=results,
        issues=all_issues,
        payroll_can_be_approved=payroll_can_be_approved,
    )
