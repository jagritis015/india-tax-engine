from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field


class ResidencyStatus(str, Enum):
    RESIDENT = "resident"
    NON_RESIDENT = "non_resident"


class Transaction(BaseModel):
    transaction_id: str
    vendor_id: str
    vendor_name: str

    invoice_number: str | None = None
    invoice_date: date | None = None

    credit_date: date | None = None
    payment_date: date | None = None

    amount: Decimal = Field(gt=0)

    nature_of_payment: str

    residency_status: ResidencyStatus

    pan_available: bool
    pan: str | None = None

    lower_deduction_certificate: bool = False
    certificate_rate: Decimal | None = None
