from typing import Any

import pandas as pd
from pydantic import BaseModel, Field

from tax_engine.ai.monthly_compliance import (
    MonthlyComplianceRun,
    evaluate_monthly_compliance,
)
from tax_engine.services.bulk_payroll_service import (
    employee_from_row,
)


class QuarantinedEmployee(BaseModel):
    row_number: int
    employee_id: str
    employee_name: str | None = None
    error: str
    action_required: str


class CompanyComplianceRun(BaseModel):
    uploaded_records: int
    valid_records: int
    quarantined_records: int

    monthly_compliance: MonthlyComplianceRun | None = None

    quarantine: list[QuarantinedEmployee] = Field(
        default_factory=list
    )

    company_run_complete: bool
    payroll_can_be_approved: bool


def _safe_text(value: Any, default: str) -> str:
    if value is None:
        return default

    try:
        if pd.isna(value):
            return default
    except (TypeError, ValueError):
        pass

    text = str(value).strip()
    return text or default


def process_company_compliance_file(
    dataframe: pd.DataFrame,
) -> CompanyComplianceRun:
    """
    Validate every uploaded employee independently.

    Valid employees continue into the deterministic monthly
    compliance engine.

    Invalid employees are quarantined and never silently dropped.
    """

    employees = []
    quarantine: list[QuarantinedEmployee] = []

    for row_number, (_, row) in enumerate(
        dataframe.iterrows(),
        start=2,
    ):
        try:
            employees.append(
                employee_from_row(row)
            )
        except Exception as exc:
            quarantine.append(
                QuarantinedEmployee(
                    row_number=row_number,
                    employee_id=_safe_text(
                        row.get("employee_id"),
                        "UNKNOWN",
                    ),
                    employee_name=_safe_text(
                        row.get("employee_name"),
                        "UNKNOWN",
                    ),
                    error=str(exc),
                    action_required=(
                        "Correct the employee input and rerun "
                        "compliance validation."
                    ),
                )
            )

    monthly = None

    if employees:
        monthly = evaluate_monthly_compliance(
            employees
        )

    company_run_complete = len(quarantine) == 0

    payroll_can_be_approved = (
        company_run_complete
        and monthly is not None
        and monthly.payroll_can_be_approved
    )

    return CompanyComplianceRun(
        uploaded_records=len(dataframe),
        valid_records=len(employees),
        quarantined_records=len(quarantine),
        monthly_compliance=monthly,
        quarantine=quarantine,
        company_run_complete=company_run_complete,
        payroll_can_be_approved=payroll_can_be_approved,
    )
