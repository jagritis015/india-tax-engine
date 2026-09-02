from typing import Any

from tax_engine.ai.exception_intelligence import (
    build_exception_intelligence,
)
from tax_engine.ai.monthly_compliance import (
    MonthlyComplianceRun,
)


def build_monthly_dashboard_data(
    monthly_run: MonthlyComplianceRun,
) -> dict[str, Any]:
    """
    Build a UI-safe monthly compliance dashboard payload.

    No statutory calculations occur here.
    """

    exceptions = build_exception_intelligence(
        monthly_run
    )

    blocking_employees = sorted(
        {
            employee.employee_id
            for queue in exceptions.queues
            if queue.blocks_payroll
            for employee in queue.employees
        }
    )

    return {
        "tax_year": monthly_run.tax_year,
        "payroll_month": monthly_run.payroll_month,

        "employees_processed": monthly_run.employees_processed,
        "ready_for_payroll": monthly_run.ready_for_payroll,
        "review_required": monthly_run.review_required,
        "blocked": monthly_run.blocked,
        "readiness_percentage": monthly_run.readiness_percentage,

        "payroll_can_be_approved": (
            monthly_run.payroll_can_be_approved
        ),

        "totals": monthly_run.totals.model_dump(),

        "exceptions": {
            "total": exceptions.total_exceptions,
            "affected_employees": exceptions.affected_employees,
            "tds": exceptions.tds_exceptions,
            "pf": exceptions.pf_exceptions,
            "pt": exceptions.pt_exceptions,
            "queues": [
                queue.model_dump()
                for queue in exceptions.queues
            ],
        },

        "blocking_employee_ids": blocking_employees,
    }
