from datetime import date
from decimal import Decimal

import pytest

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.statutory.catalog import StatutoryRuleUnavailableError
from tax_engine.tds.deduction_eligibility import calculate_eligible_deductions


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


def test_new_regime_gets_75000_standard_deduction():
    employee = make_employee(tax_regime=TaxRegime.NEW, regime_declared=True)
    result = calculate_eligible_deductions(employee, Decimal("1500000"))
    assert result["standard_deduction"] == Decimal("75000")


def test_old_regime_gets_50000_standard_deduction():
    employee = make_employee(tax_regime=TaxRegime.OLD, regime_declared=True)
    result = calculate_eligible_deductions(employee, Decimal("1500000"))
    assert result["standard_deduction"] == Decimal("50000")


def test_professional_tax_not_deductible_under_new_regime():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        professional_tax_paid=Decimal("2400"),
    )
    result = calculate_eligible_deductions(employee, Decimal("1500000"))
    assert result["professional_tax"] == Decimal("0")


def test_professional_tax_deductible_under_old_regime():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        professional_tax_paid=Decimal("2400"),
    )
    result = calculate_eligible_deductions(employee, Decimal("1500000"))
    assert result["professional_tax"] == Decimal("2400")


def test_section_123_not_allowed_under_new_regime():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        deduction_80c=Decimal("150000"),
    )
    result = calculate_eligible_deductions(employee, Decimal("1500000"))
    assert result["deduction_123"] == Decimal("0")


def test_section_123_allowed_under_old_regime_up_to_150000_with_verified_evidence():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        deduction_80c=Decimal("200000"),
        tax_declaration_evidence_verified=True,
    )
    result = calculate_eligible_deductions(employee, Decimal("1500000"))
    assert result["deduction_123"] == Decimal("150000")


def test_section_123_fails_closed_without_verified_qualifying_payment_evidence():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        deduction_80c=Decimal("100000"),
        tax_declaration_evidence_verified=False,
    )
    with pytest.raises(
        StatutoryRuleUnavailableError,
        match="upstream-verified qualifying-payment evidence",
    ):
        calculate_eligible_deductions(employee, Decimal("1500000"))


def test_legacy_80d_aggregate_fails_closed():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        deduction_80d=Decimal("25000"),
    )
    with pytest.raises(
        StatutoryRuleUnavailableError,
        match="legacy aggregate deduction_80d cannot be safely interpreted",
    ):
        calculate_eligible_deductions(employee, Decimal("1500000"))


def test_structured_section_126_inputs_flow_through_production_deduction_path():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
        health_insurance_self_family_premium=Decimal("25000"),
        health_insurance_parents_premium=Decimal("50000"),
        health_parents_have_senior_citizen=True,
        health_insurance_self_family_non_cash_verified=True,
        health_insurance_parents_non_cash_verified=True,
        health_insurance_evidence_verified=True,
    )
    result = calculate_eligible_deductions(employee, Decimal("1500000"))
    assert result["deduction_health_insurance"] == Decimal("75000")


def test_section_126_is_zero_under_new_regime_even_when_declared():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        health_insurance_self_family_premium=Decimal("25000"),
        health_insurance_self_family_non_cash_verified=True,
        health_insurance_evidence_verified=True,
    )
    result = calculate_eligible_deductions(employee, Decimal("1500000"))
    assert result["deduction_health_insurance"] == Decimal("0")
