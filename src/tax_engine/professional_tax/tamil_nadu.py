from decimal import Decimal

from tax_engine.professional_tax.half_year_context import (
    PTHalfYearContext,
    is_tamil_nadu_pt_deduction_month,
)


ZERO = Decimal("0")


def calculate_tamil_nadu_half_year_liability(
    half_year_salary_or_wages: Decimal,
) -> Decimal:
    """
    Calculate Tamil Nadu half-year Professional Tax liability
    using the statutory half-year income slabs.
    """

    income = Decimal(half_year_salary_or_wages)

    if income <= Decimal("21000"):
        return ZERO

    if income <= Decimal("30000"):
        return Decimal("135")

    if income <= Decimal("45000"):
        return Decimal("315")

    if income <= Decimal("60000"):
        return Decimal("690")

    if income <= Decimal("75000"):
        return Decimal("1025")

    return Decimal("1250")


def calculate_tamil_nadu_pt(
    *,
    payroll_month: int,
    context: PTHalfYearContext,
) -> Decimal:
    """
    Return the PT deduction for the current payroll.

    Tamil Nadu PT is assessed half-yearly.

    August and January are the normal salary deduction months.
    Outside those months, no current-month deduction is made.

    Any PT already deducted for the half-year is subtracted
    so that payroll does not deduct the same liability twice.
    """

    if context.days_employed_in_half_year < 60:
        return ZERO

    if not is_tamil_nadu_pt_deduction_month(payroll_month):
        return ZERO

    liability = calculate_tamil_nadu_half_year_liability(
        context.half_year_salary_or_wages
    )

    remaining = (
        liability
        - context.pt_already_deducted_for_half_year
    )

    return max(ZERO, remaining)
