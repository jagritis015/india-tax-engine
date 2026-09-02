from collections import defaultdict
from typing import Iterable

from pydantic import BaseModel, Field

from tax_engine.ai.compliance import EmployeeComplianceResult
from tax_engine.ai.monthly_compliance import (
    MonthlyComplianceRun,
    evaluate_monthly_compliance,
)
from tax_engine.payroll.employee import EmployeePayrollInput


class ExceptionEmployee(BaseModel):
    employee_id: str
    employee_name: str
    payroll_status: str


class ExceptionQueue(BaseModel):
    component: str
    severity: str
    issue_code: str
    title: str

    affected_count: int

    employees: list[ExceptionEmployee] = Field(
        default_factory=list
    )

    next_action: str
    blocks_payroll: bool


class ExceptionIntelligenceResult(BaseModel):
    tax_year: str
    payroll_month: int

    payroll_can_be_approved: bool

    total_exceptions: int
    affected_employees: int

    tds_exceptions: int
    pf_exceptions: int
    pt_exceptions: int

    queues: list[ExceptionQueue] = Field(
        default_factory=list
    )


def _default_action(component: str) -> str:
    actions = {
        "TDS": (
            "Resolve declaration, evidence, income or TDS "
            "inputs before payroll approval."
        ),
        "PF": (
            "Resolve PF applicability, membership, wage or "
            "higher-wage contribution inputs."
        ),
        "PT": (
            "Verify the employee's applicable state "
            "Professional Tax rule or required context."
        ),
    }

    return actions.get(
        component,
        "Resolve the underlying compliance issue."
    )


def build_exception_intelligence(
    monthly_run: MonthlyComplianceRun,
) -> ExceptionIntelligenceResult:
    """
    Build operational exception queues from a deterministic
    monthly compliance run.

    This layer does not calculate statutory amounts and does
    not change employee compliance decisions.
    """

    grouped: dict[
        tuple[str, str, str],
        list[tuple[EmployeeComplianceResult, object]],
    ] = defaultdict(list)

    affected_employee_ids: set[str] = set()

    for employee_result in monthly_run.employee_results:
        for issue in employee_result.issues:
            key = (
                issue.component,
                issue.severity,
                issue.code,
            )

            grouped[key].append(
                (employee_result, issue)
            )

            affected_employee_ids.add(
                employee_result.employee_id
            )

    queues: list[ExceptionQueue] = []

    for (
        component,
        severity,
        issue_code,
    ), rows in grouped.items():

        first_issue = rows[0][1]

        employees = [
            ExceptionEmployee(
                employee_id=result.employee_id,
                employee_name=result.employee_name,
                payroll_status=result.payroll_status,
            )
            for result, _ in rows
        ]

        blocks_payroll = any(
            employee.payroll_status
            in {"REVIEW_REQUIRED", "BLOCKED"}
            for employee in employees
        )

        queues.append(
            ExceptionQueue(
                component=component,
                severity=severity,
                issue_code=issue_code,
                title=str(first_issue.message),
                affected_count=len(employees),
                employees=employees,
                next_action=(
                    first_issue.action_required
                    or _default_action(component)
                ),
                blocks_payroll=blocks_payroll,
            )
        )

    severity_order = {
        "CRITICAL": 0,
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3,
    }

    queues.sort(
        key=lambda q: (
            severity_order.get(q.severity, 99),
            q.component,
            q.issue_code,
        )
    )

    return ExceptionIntelligenceResult(
        tax_year=monthly_run.tax_year,
        payroll_month=monthly_run.payroll_month,
        payroll_can_be_approved=(
            monthly_run.payroll_can_be_approved
        ),
        total_exceptions=sum(
            queue.affected_count
            for queue in queues
        ),
        affected_employees=len(
            affected_employee_ids
        ),
        tds_exceptions=sum(
            queue.affected_count
            for queue in queues
            if queue.component == "TDS"
        ),
        pf_exceptions=sum(
            queue.affected_count
            for queue in queues
            if queue.component == "PF"
        ),
        pt_exceptions=sum(
            queue.affected_count
            for queue in queues
            if queue.component == "PT"
        ),
        queues=queues,
    )


def evaluate_monthly_exceptions(
    employees: Iterable[EmployeePayrollInput],
) -> ExceptionIntelligenceResult:
    """
    Convenience orchestration entry point for monthly
    compliance plus exception intelligence.
    """

    monthly_run = evaluate_monthly_compliance(
        employees
    )

    return build_exception_intelligence(
        monthly_run
    )
