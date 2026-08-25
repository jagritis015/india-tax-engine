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


def make_employee(**overrides):
    data = {
        "employee_id": "EMP001",
        "employee_name": "Test Employee",
        "pan": "ABCDE1234F",
        "sex": Sex.MALE,
        "date_of_joining": date(2026, 4, 1),
        "work_state": "Karnataka",

        "tax_regime": TaxRegime.NEW,
        "regime_declared": True,

        "basic_salary": Decimal("50000"),
        "hra": Decimal("20000"),
        "special_allowance": Decimal("30000"),

        "taxable_salary_ytd": Decimal("400000"),
        "tds_deducted_ytd": Decimal("0"),

        "pf_applicable": True,
        "pf_wages": Decimal("15000"),

        "payroll_month": 8,
        "tax_year": "2026-27",
    }

    data.update(overrides)

    return EmployeePayrollInput(**data)


def test_complete_karnataka_payroll():
    employee = make_employee()

    result = calculate_monthly_payroll(employee)

    assert result["status"] == "CALCULATED"
    assert result["gross_salary"] == Decimal("100000")
    assert result["employee_pf"] == Decimal("1800")
    assert result["professional_tax"] == Decimal("200")

    assert result["total_deductions"] == (
        result["tds"]
        + Decimal("1800")
        + Decimal("200")
    )

    assert result["net_salary"] == (
        result["gross_salary"]
        - result["total_deductions"]
    )


def test_missing_pf_wages_requires_review():
    employee = make_employee(
        pf_wages=None,
    )

    result = calculate_monthly_payroll(employee)

    assert result["status"] == "REVIEW_REQUIRED"
    assert result["employee_pf"] is None
    assert result["net_salary"] is None


def test_unconfigured_pt_state_requires_review():
    employee = make_employee(
        work_state="Tamil Nadu",
    )

    result = calculate_monthly_payroll(employee)

    assert result["status"] == "REVIEW_REQUIRED"
    assert result["professional_tax"] is None
    assert result["net_salary"] is None


def test_pf_not_applicable_is_zero():
    employee = make_employee(
        pf_applicable=False,
        pf_wages=None,
    )

    result = calculate_monthly_payroll(employee)

    assert result["status"] == "CALCULATED"
    assert result["employee_pf"] == Decimal("0")
