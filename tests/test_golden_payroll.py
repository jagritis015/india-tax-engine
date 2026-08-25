from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    Sex,
    TaxRegime,
)
from tax_engine.payroll.payroll_engine import (
    calculate_monthly_payroll,
)


def test_golden_new_regime_karnataka_employee():
    employee = EmployeePayrollInput(
        employee_id="GOLD001",
        employee_name="Golden Employee 1",
        pan="ABCDE1234F",
        sex=Sex.MALE,
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",

        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("100000"),
        hra=Decimal("40000"),
        special_allowance=Decimal("60000"),

        basic_salary_ytd=Decimal("400000"),
        hra_ytd=Decimal("160000"),
        taxable_salary_ytd=Decimal("800000"),

        tds_deducted_ytd=Decimal("0"),

        pf_applicable=True,
        pf_wages=Decimal("15000"),

        payroll_month=8,
        tax_year="2026-27",
    )

    result = calculate_monthly_payroll(employee)

    assert result["status"] == "CALCULATED"

    assert result["gross_salary"] == Decimal("200000")

    assert (
        result["tds_breakdown"]["projected_salary"]
        == Decimal("2400000")
    )

    assert (
        result["tds_breakdown"]["estimated_total_income"]
        == Decimal("2325000")
    )

    assert (
        result["tds_breakdown"]["annual_tax_liability"]
        == Decimal("292500")
    )

    assert result["tds"] == Decimal("36563")
    assert result["employee_pf"] == Decimal("1800")
    assert result["professional_tax"] == Decimal("200")

    assert result["total_deductions"] == Decimal("38563")
    assert result["net_salary"] == Decimal("161437")


def test_golden_below_rebate_threshold_new_regime():
    employee = EmployeePayrollInput(
        employee_id="GOLD002",
        employee_name="Golden Employee 2",
        sex=Sex.FEMALE,
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",

        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("50000"),
        hra=Decimal("20000"),
        special_allowance=Decimal("30000"),

        taxable_salary_ytd=Decimal("400000"),

        pf_applicable=True,
        pf_wages=Decimal("15000"),

        payroll_month=8,
        tax_year="2026-27",
    )

    result = calculate_monthly_payroll(employee)

    assert result["status"] == "CALCULATED"

    assert (
        result["tds_breakdown"]["annual_tax_liability"]
        == Decimal("0")
    )

    assert result["tds"] == Decimal("0")
    assert result["employee_pf"] == Decimal("1800")
    assert result["professional_tax"] == Decimal("200")

    assert result["total_deductions"] == Decimal("2000")
    assert result["net_salary"] == Decimal("98000")
