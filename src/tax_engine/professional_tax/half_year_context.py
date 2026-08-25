from decimal import Decimal

from pydantic import BaseModel, Field


class PTHalfYearContext(BaseModel):
    """
    Payroll context required for Professional Tax jurisdictions
    that assess liability on a half-year basis.

    Tamil Nadu:
    First half: April to September
    Second half: October to March
    """

    half_year_salary_or_wages: Decimal = Field(
        ge=Decimal("0")
    )

    days_employed_in_half_year: int = Field(
        ge=0,
        le=184,
    )

    pt_already_deducted_for_half_year: Decimal = Field(
        default=Decimal("0"),
        ge=Decimal("0"),
    )


def tamil_nadu_half_year_number(
    payroll_month: int,
) -> int:
    """
    Tamil Nadu PT half-year:

    1 = April to September
    2 = October to March
    """

    if payroll_month in {4, 5, 6, 7, 8, 9}:
        return 1

    if payroll_month in {10, 11, 12, 1, 2, 3}:
        return 2

    raise ValueError("Invalid payroll month")


def is_tamil_nadu_pt_deduction_month(
    payroll_month: int,
) -> bool:
    """
    Tamil Nadu Urban Local Bodies Rules, 2023:
    salary PT is recovered from the August and January pay bills.
    """

    return payroll_month in {8, 1}
