from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput


ZERO = Decimal("0")


def current_month_gross(
    employee: EmployeePayrollInput,
) -> Decimal:
    return (
        employee.basic_salary
        + employee.dearness_allowance
        + employee.hra
        + employee.special_allowance
        + employee.bonus
        + employee.commission
        + employee.other_taxable_earnings
        + employee.current_month_taxable_perquisites
    )


def months_remaining_including_current(
    payroll_month: int,
) -> int:
    """
    Tax Year runs April to March.

    Calendar numbering:
    Apr=4 ... Dec=12, Jan=1 ... Mar=3.
    """

    month_sequence = [
        4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3
    ]

    if payroll_month not in month_sequence:
        raise ValueError("Invalid payroll month")

    index = month_sequence.index(payroll_month)

    return len(month_sequence) - index


def project_tax_year_salary(
    employee: EmployeePayrollInput,
) -> Decimal:
    """
    Estimate Tax Year employment income.

    Includes:
    - salary already earned
    - recurring current-month earnings projected forward
    - taxable perquisites
    - known future bonus / variable pay
    - previous-employer taxable salary
    """

    monthly_gross = current_month_gross(employee)

    remaining_months = months_remaining_including_current(
        employee.payroll_month
    )

    projected_current_employer_salary = (
        employee.taxable_salary_ytd
        + employee.taxable_perquisites_ytd
        + (monthly_gross * remaining_months)
        + employee.projected_future_bonus
        + employee.projected_future_variable_pay
    )

    total_projected_salary = (
        projected_current_employer_salary
        + employee.previous_employer_taxable_salary
    )

    return total_projected_salary


def project_component(
    amount_ytd: Decimal,
    current_month_amount: Decimal,
    payroll_month: int,
) -> Decimal:
    """
    Project a recurring salary component
    through the remaining Tax Year.
    """

    remaining_months = months_remaining_including_current(
        payroll_month
    )

    return (
        amount_ytd
        + (current_month_amount * remaining_months)
    )
