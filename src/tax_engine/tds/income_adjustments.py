from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.tds.regime_resolver import resolve_tax_regime


ZERO = Decimal("0")
HOUSE_PROPERTY_INTER_HEAD_LOSS_CAP = Decimal("200000")


def calculate_declared_income_adjustments(
    employee: EmployeePayrollInput,
) -> dict[str, Decimal | bool | str]:
    """
    Resolve non-salary inputs used for salary TDS estimation.

    Current treatment:
    - Declared positive other income may increase estimated income.
    - House-property income may increase estimated income.
    - House-property loss requires evidence.
    - Under old regime, eligible inter-head house-property loss
      is capped at Rs 2,00,000.
    - Under new regime, house-property loss is not used to reduce
      salary / other-head income in this payroll calculation.
    - Previous-employer data requires verification.
    """

    regime = resolve_tax_regime(employee)

    other_income = ZERO
    house_property_adjustment = ZERO
    house_property_loss_disallowed = ZERO

    review_required = False

    if employee.other_income_declared_by_employee:
        other_income = employee.other_income_declared

    house_property_amount = employee.house_property_income_or_loss

    if house_property_amount != ZERO:
        if not employee.house_property_evidence_verified:
            review_required = True

        else:
            # Positive house-property income is considered
            # under either regime.
            if house_property_amount > ZERO:
                house_property_adjustment = house_property_amount

            # Negative house-property income / loss.
            else:
                absolute_loss = abs(house_property_amount)

                if regime == TaxRegime.OLD:
                    allowed_loss = min(
                        absolute_loss,
                        HOUSE_PROPERTY_INTER_HEAD_LOSS_CAP,
                    )

                    house_property_adjustment = -allowed_loss

                    house_property_loss_disallowed = (
                        absolute_loss - allowed_loss
                    )

                else:
                    # New-regime payroll calculation must not
                    # reduce salary/other-head income by this loss.
                    house_property_adjustment = ZERO
                    house_property_loss_disallowed = absolute_loss

    if (
        employee.previous_employer_taxable_salary > ZERO
        or employee.previous_employer_tds > ZERO
    ):
        if not employee.previous_employer_details_verified:
            review_required = True

    return {
        "regime": regime.value,
        "other_income": other_income,
        "house_property_adjustment": house_property_adjustment,
        "house_property_loss_disallowed":
            house_property_loss_disallowed,
        "review_required": review_required,
    }
