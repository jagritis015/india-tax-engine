from typing import Any, Literal

from pydantic import BaseModel, Field


class TaxToolResponse(BaseModel):
    """
    Canonical boundary between deterministic tax calculations
    and AI consumers.
    """

    tool: str
    status: Literal["CALCULATED", "REVIEW_REQUIRED", "BLOCKED"]

    summary: dict[str, Any]
    breakdowns: dict[str, Any] = Field(default_factory=dict)

    review_reasons: list[str] = Field(default_factory=list)

    source: Literal["DETERMINISTIC_ENGINE"] = "DETERMINISTIC_ENGINE"
    ai_calculated_amounts: Literal[False] = False


class PayrollExplanationContext(BaseModel):
    """
    Facts an AI model may use when explaining a payroll result.

    This object contains engine-produced facts only.
    """

    status: str
    employee_id: str
    employee_name: str
    tax_year: str
    payroll_month: int

    gross_salary: Any

    tds: Any | None = None
    employee_pf: Any | None = None
    professional_tax: Any | None = None
    total_deductions: Any | None = None
    net_salary: Any | None = None

    tds_breakdown: dict[str, Any] | None = None
    pf_breakdown: dict[str, Any] | None = None
    pt_breakdown: Any | None = None
