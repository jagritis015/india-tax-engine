from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field


class ThresholdType(str, Enum):
    SINGLE = "single"
    ANNUAL = "annual"
    MONTHLY = "monthly"
    CUMULATIVE = "cumulative"
    NONE = "none"


class TDSRule(BaseModel):
    rule_id: str

    act_name: str = "Income-tax Act, 2025"
    statutory_section: str
    table_item: str | None = None

    legacy_section: str | None = None

    nature_of_payment: str

    payer_type: str | None = None
    payee_type: str | None = None

    resident_only: bool = True

    threshold_type: ThresholdType
    threshold_amount: Decimal | None = Field(default=None, ge=0)

    normal_rate: Decimal = Field(ge=0, le=1)

    effective_from: date
    effective_to: date | None = None

    source_reference: str
