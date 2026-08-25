from datetime import date

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.tds.regime_resolver import resolve_tax_regime


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


def test_declared_new_regime_is_used():
    employee = make_employee(
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
    )

    assert resolve_tax_regime(employee) == TaxRegime.NEW


def test_declared_old_regime_is_used():
    employee = make_employee(
        tax_regime=TaxRegime.OLD,
        regime_declared=True,
    )

    assert resolve_tax_regime(employee) == TaxRegime.OLD


def test_no_declaration_defaults_to_new_regime():
    employee = make_employee(
        tax_regime=None,
        regime_declared=False,
    )

    assert resolve_tax_regime(employee) == TaxRegime.NEW
