from datetime import date
from decimal import Decimal

import pytest

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError
from tax_engine.tds.taxable_salary import calculate_taxable_salary


def make_employee(**overrides):
    data = {
        "employee_id": "EMP001",
        "employee_name": "Test Employee",
        "date_of_joining": date(2026, 4, 1),
        "work_state": "Karnataka",
        "payroll_month": 8,
        "tax_year": "2026-27",
    }

    data.update(overrides)
    return EmployeePayrollInput(**data)


def test_new_regime_taxable_salary():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        professional_tax_paid=Decimal("2400"),
        deduction_80c=Decimal("150000"),
    )

    result = calculate_taxable_salary(
        employee,
        Decimal("1500000"),
    )

    assert result["standard_deduction"] == Decimal("75000")
    assert result["professional_tax"] == Decimal("0")
    assert result["deduction_123"] == Decimal("0")
    assert result["taxable_salary"] == Decimal("1425000")


def test_old_regime_taxable_salary_with_verified_schedule_xv_evidence():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        professional_tax_paid=Decimal("2400"),
        deduction_80c=Decimal("150000"),
        tax_declaration_evidence_verified=True,
    )

    result = calculate_taxable_salary(
        employee,
        Decimal("1500000"),
    )

    assert result["standard_deduction"] == Decimal("50000")
    assert result["professional_tax"] == Decimal("2400")
    assert result["deduction_123"] == Decimal("150000")
    assert result["deduction_health_insurance"] == Decimal("0")
    assert result["taxable_salary"] == Decimal("1297600")


def test_old_regime_health_insurance_fails_closed_in_taxable_salary_path():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        deduction_80d=Decimal("25000"),
    )

    with pytest.raises(
        StatutoryRuleUnavailableError,
        match="health-insurance deduction is not yet backed by a verified statutory rule",
    ):
        calculate_taxable_salary(employee, Decimal("1500000"))


def test_taxable_salary_cannot_be_negative():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        professional_tax_paid=Decimal("50000"),
    )

    result = calculate_taxable_salary(
        employee,
        Decimal("40000"),
    )

    assert result["taxable_salary"] == Decimal("0")


def test_old_regime_hra_is_deducted_from_salary():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        basic_salary=Decimal("50000"),
        hra=Decimal("25000"),
        basic_salary_ytd=Decimal("200000"),
        hra_ytd=Decimal("100000"),
        annual_rent_paid=Decimal("360000"),
        hra_location="Bengaluru",
    )

    result = calculate_taxable_salary(
        employee,
        Decimal("1200000"),
    )

    assert result["projected_basic"] == Decimal("600000")
    assert result["projected_hra"] == Decimal("300000")
    assert result["hra_exemption"] == Decimal("300000")
    assert result["salary_after_exemptions"] == Decimal("900000")
