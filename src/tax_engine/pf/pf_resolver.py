from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput


PF_WAGE_CEILING = Decimal("15000")


def resolve_pf_applicability(
    employee: EmployeePayrollInput,
) -> dict:
    """
    Resolve employee EPF applicability for payroll.

    V1 logic:
    - Explicit PF applicability can be used when payroll has
      already verified the employee's statutory status.
    - International workers are treated as PF applicable.
    - Existing EPF members continue in membership.
    - A fresh employee joining above the statutory wage ceiling
      may be an excluded employee.
    - Missing joining information requires review.
    """

    if employee.pf_applicable is not None:
        return {
            "pf_applicable": employee.pf_applicable,
            "review_required": False,
            "reason": "verified_payroll_status",
        }

    if employee.international_worker:
        return {
            "pf_applicable": True,
            "review_required": False,
            "reason": "international_worker",
        }

    if employee.prior_epf_member:
        return {
            "pf_applicable": True,
            "review_required": False,
            "reason": "existing_epf_member",
        }

    if employee.joining_pf_wages is None:
        return {
            "pf_applicable": None,
            "review_required": True,
            "reason": "joining_pf_wages_missing",
        }

    if employee.joining_pf_wages > PF_WAGE_CEILING:
        return {
            "pf_applicable": False,
            "review_required": False,
            "reason": "fresh_excluded_employee_above_wage_ceiling",
        }

    return {
        "pf_applicable": True,
        "review_required": False,
        "reason": "fresh_employee_within_wage_ceiling",
    }


def resolve_higher_wage_contribution(
    employee: EmployeePayrollInput,
) -> dict:
    """
    Higher-wage EPF contribution must not be used unless
    the required option / verification is present.
    """

    if not employee.contribute_on_higher_pf_wages:
        return {
            "allowed": False,
            "review_required": False,
        }

    if employee.international_worker:
        return {
            "allowed": True,
            "review_required": False,
        }

    if employee.higher_pf_wage_option_verified:
        return {
            "allowed": True,
            "review_required": False,
        }

    return {
        "allowed": False,
        "review_required": True,
    }
