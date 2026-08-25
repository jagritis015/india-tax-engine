from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput
from tax_engine.pf.pf_resolver import (
    resolve_higher_wage_contribution,
    resolve_pf_applicability,
)


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


def test_existing_epf_member_continues_membership():
    employee = make_employee(
        prior_epf_member=True,
        joining_pf_wages=Decimal("50000"),
    )

    result = resolve_pf_applicability(employee)

    assert result["pf_applicable"] is True
    assert result["review_required"] is False


def test_fresh_employee_above_ceiling_can_be_excluded():
    employee = make_employee(
        prior_epf_member=False,
        joining_pf_wages=Decimal("20000"),
    )

    result = resolve_pf_applicability(employee)

    assert result["pf_applicable"] is False


def test_fresh_employee_within_ceiling_is_applicable():
    employee = make_employee(
        prior_epf_member=False,
        joining_pf_wages=Decimal("15000"),
    )

    result = resolve_pf_applicability(employee)

    assert result["pf_applicable"] is True


def test_missing_joining_pf_data_requires_review():
    employee = make_employee(
        pf_applicable=None,
        prior_epf_member=False,
        joining_pf_wages=None,
    )

    result = resolve_pf_applicability(employee)

    assert result["review_required"] is True


def test_international_worker_is_pf_applicable():
    employee = make_employee(
        international_worker=True,
        joining_pf_wages=Decimal("100000"),
    )

    result = resolve_pf_applicability(employee)

    assert result["pf_applicable"] is True


def test_unverified_higher_wage_option_requires_review():
    employee = make_employee(
        contribute_on_higher_pf_wages=True,
        higher_pf_wage_option_verified=False,
    )

    result = resolve_higher_wage_contribution(employee)

    assert result["review_required"] is True


def test_verified_higher_wage_option_allowed():
    employee = make_employee(
        contribute_on_higher_pf_wages=True,
        higher_pf_wage_option_verified=True,
    )

    result = resolve_higher_wage_contribution(employee)

    assert result["allowed"] is True
