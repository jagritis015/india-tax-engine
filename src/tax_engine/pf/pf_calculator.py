from decimal import Decimal, ROUND_HALF_UP


ZERO = Decimal("0")
STANDARD_EMPLOYEE_RATE = Decimal("0.12")
REDUCED_EMPLOYEE_RATE = Decimal("0.10")
STATUTORY_WAGE_CEILING = Decimal("15000")


def calculate_employee_pf(
    pf_wages: Decimal,
    pf_applicable: bool = True,
    contribution_rate: Decimal = STANDARD_EMPLOYEE_RATE,
    contribute_on_higher_wages: bool = False,
    international_worker: bool = False,
) -> dict[str, Decimal | bool]:
    """
    Calculate employee EPF contribution.

    V1 rules:
    - No contribution where PF is not applicable.
    - Standard contribution rate defaults to 12%.
    - Statutory wage ceiling is Rs 15,000.
    - Higher-wage contribution can be explicitly enabled.
    - Statutory wage ceiling is not applied to international workers.

    Eligibility / membership determination is kept outside this
    arithmetic function and must be resolved by payroll inputs.
    """

    if pf_wages < ZERO:
        raise ValueError("pf_wages cannot be negative")

    if contribution_rate not in {
        STANDARD_EMPLOYEE_RATE,
        REDUCED_EMPLOYEE_RATE,
    }:
        raise ValueError(
            "contribution_rate must be 0.12 or 0.10"
        )

    if not pf_applicable:
        contribution_base = ZERO
        employee_pf = ZERO

    else:
        if international_worker or contribute_on_higher_wages:
            contribution_base = pf_wages
        else:
            contribution_base = min(
                pf_wages,
                STATUTORY_WAGE_CEILING,
            )

        employee_pf = (
            contribution_base * contribution_rate
        ).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )

    return {
        "pf_applicable": pf_applicable,
        "pf_wages": pf_wages,
        "contribution_base": contribution_base,
        "contribution_rate": contribution_rate,
        "contribute_on_higher_wages": contribute_on_higher_wages,
        "international_worker": international_worker,
        "employee_pf": employee_pf,
    }
