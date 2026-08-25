from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel


class PayrollResult(BaseModel):
    """
    Canonical output contract for one employee's monthly payroll
    statutory deduction calculation.
    """

    status: Literal["CALCULATED", "REVIEW_REQUIRED"]

    employee_id: str
    employee_name: str

    tax_year: str
    payroll_month: int

    gross_salary: Decimal

    tds: Decimal | None = None
    employee_pf: Decimal | None = None
    professional_tax: Decimal | None = None

    total_deductions: Decimal | None = None
    net_salary: Decimal | None = None

    tds_breakdown: dict[str, Any] | None = None
    pf_breakdown: dict[str, Any] | None = None
    pt_breakdown: Any | None = None
