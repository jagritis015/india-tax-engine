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


def test_tamil_nadu_august_payroll_calculates_pt():
    employee = EmployeePayrollInput(
        employee_id="TN001",
        employee_name="Tamil Nadu Employee",
        sex=Sex.FEMALE,
        date_of_joining=date(2026, 4, 1),
        work_state="Tamil Nadu",

        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("200000"),
        hra=Decimal("80000"),
        special_allowance=Decimal("120000"),

        taxable_salary_ytd=Decimal("1600000"),
        tds_deducted_ytd=Decimal("150000"),

        pf_applicable=True,
        pf_wages=Decimal("15000"),

        pt_half_year_salary_or_wages=Decimal("2400000"),
        pt_days_employed_in_half_year=150,
        pt_already_deducted_for_half_year=Decimal("0"),

        payroll_month=8,
        tax_year="2026-27",
    )

    result = calculate_monthly_payroll(employee)

    assert result["status"] == "CALCULATED"
    assert result["professional_tax"] == Decimal("1250")
    assert result["net_salary"] is not None


def test_tamil_nadu_missing_context_requires_review():
    employee = EmployeePayrollInput(
        employee_id="TN002",
        employee_name="Tamil Nadu Review Employee",
        sex=Sex.FEMALE,
        date_of_joining=date(2026, 4, 1),
        work_state="Tamil Nadu",

        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("200000"),

        pf_applicable=False,

        payroll_month=8,
        tax_year="2026-27",
    )

    result = calculate_monthly_payroll(employee)

    assert result["status"] == "REVIEW_REQUIRED"
    assert result["professional_tax"] is None
