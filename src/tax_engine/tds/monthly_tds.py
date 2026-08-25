from decimal import Decimal, ROUND_HALF_UP


ZERO = Decimal("0")


def calculate_monthly_tds(
    annual_tax_liability: Decimal,
    tds_deducted_current_employer_ytd: Decimal,
    previous_employer_tds: Decimal,
    remaining_payroll_months: int,
) -> dict[str, Decimal | int]:

    if annual_tax_liability < ZERO:
        raise ValueError(
            "annual_tax_liability cannot be negative"
        )

    if tds_deducted_current_employer_ytd < ZERO:
        raise ValueError(
            "tds_deducted_current_employer_ytd cannot be negative"
        )

    if previous_employer_tds < ZERO:
        raise ValueError(
            "previous_employer_tds cannot be negative"
        )

    if remaining_payroll_months <= 0:
        raise ValueError(
            "remaining_payroll_months must be greater than zero"
        )

    total_tds_credit_considered = (
        tds_deducted_current_employer_ytd
        + previous_employer_tds
    )

    remaining_tax = max(
        ZERO,
        annual_tax_liability
        - total_tds_credit_considered,
    )

    if remaining_payroll_months == 1:
        # Final payroll month absorbs the exact residual.
        current_month_tds = remaining_tax

    else:
        current_month_tds = (
            remaining_tax
            / Decimal(remaining_payroll_months)
        ).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )

    return {
        "annual_tax_liability": annual_tax_liability,
        "tds_deducted_current_employer_ytd":
            tds_deducted_current_employer_ytd,
        "previous_employer_tds": previous_employer_tds,
        "total_tds_credit_considered":
            total_tds_credit_considered,
        "remaining_tax": remaining_tax,
        "remaining_payroll_months":
            remaining_payroll_months,
        "current_month_tds": current_month_tds,
    }
