from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    Sex,
    TaxRegime,
)
from tax_engine.services.payroll_service import (
    run_employee_payroll,
)


def test_payroll_service_returns_complete_result():
    employee = EmployeePayrollInput(
        employee_id="SERVICE001",
        employee_name="Service Test Employee",
        sex=Sex.MALE,
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("100000"),
        hra=Decimal("40000"),
        special_allowance=Decimal("60000"),

        taxable_salary_ytd=Decimal("800000"),

        pf_applicable=True,
        pf_wages=Decimal("15000"),

        payroll_month=8,
        tax_year="2026-27",
    )

    result = run_employee_payroll(employee)

    assert result["status"] == "CALCULATED"
    assert result["gross_salary"] == Decimal("200000")
    assert result["tds"] == Decimal("36563")
    assert result["employee_pf"] == Decimal("1800")
    assert result["professional_tax"] == Decimal("200")
    assert result["net_salary"] == Decimal("161437")
