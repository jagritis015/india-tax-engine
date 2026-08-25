from tax_engine.payroll.employee import EmployeePayrollInput
from tax_engine.payroll.payroll_engine import calculate_monthly_payroll


def run_employee_payroll(
    employee: EmployeePayrollInput,
) -> dict:
    """
    Stable application-facing payroll entry point.

    UI, batch processors, APIs and AI agents should call
    this service instead of importing calculation internals.
    """

    return calculate_monthly_payroll(employee)
