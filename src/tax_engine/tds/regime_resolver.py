from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime


def resolve_tax_regime(employee: EmployeePayrollInput) -> TaxRegime:
    """
    Resolve the tax regime to use for salary TDS.

    If the employee has made a valid declaration,
    use the declared regime.

    Otherwise, default to the new regime.
    """

    if employee.regime_declared and employee.tax_regime is not None:
        return employee.tax_regime

    return TaxRegime.NEW
