from decimal import Decimal
from enum import Enum

from pydantic import BaseModel


class PTStatus(str, Enum):
    CALCULATED = "calculated"
    NOT_APPLICABLE = "not_applicable"
    REVIEW_REQUIRED = "review_required"


class ProfessionalTaxResult(BaseModel):
    state: str
    tax_year: str
    payroll_month: int
    monthly_salary_or_wages: Decimal
    professional_tax: Decimal
    status: PTStatus
    rule_reference: str | None = None
    review_reason: str | None = None
