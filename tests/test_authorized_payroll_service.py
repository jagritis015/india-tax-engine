from datetime import date
from decimal import Decimal

import pytest

from tax_engine.payroll.employee import EmployeePayrollInput, Sex, TaxRegime
from tax_engine.platform.audit import InMemoryAuditSink
from tax_engine.platform.tenancy import ActorContext, AuthorizationError, Role
from tax_engine.services.authorized_payroll_service import (
    run_authorized_employee_payroll,
)


def employee() -> EmployeePayrollInput:
    return EmployeePayrollInput(
        employee_id="EMP-001",
        employee_name="Payroll Employee",
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


def actor(role: Role, *, company_id="company-a", employee_id=None) -> ActorContext:
    return ActorContext(
        user_id="user-1",
        company_id=company_id,
        role=role,
        employee_id=employee_id,
    )


@pytest.mark.parametrize("role", [Role.HR, Role.PAYROLL, Role.ADMIN])
def test_authorized_operational_roles_can_run_payroll(role):
    audit = InMemoryAuditSink()

    result = run_authorized_employee_payroll(
        actor=actor(role),
        company_id="company-a",
        employee=employee(),
        audit=audit,
    )

    assert result["status"] == "CALCULATED"
    assert len(audit.events) == 1
    assert audit.events[0].allowed is True
    assert audit.events[0].action == "run_employee_payroll"


@pytest.mark.parametrize(
    "role",
    [Role.EMPLOYEE, Role.FINANCE, Role.COMPLIANCE, Role.LEADERSHIP],
)
def test_non_payroll_roles_cannot_run_employee_payroll(role):
    audit = InMemoryAuditSink()
    employee_id = "EMP-001" if role is Role.EMPLOYEE else None

    with pytest.raises(AuthorizationError, match="not permitted"):
        run_authorized_employee_payroll(
            actor=actor(role, employee_id=employee_id),
            company_id="company-a",
            employee=employee(),
            audit=audit,
        )

    assert len(audit.events) == 1
    assert audit.events[0].allowed is False


def test_cross_company_payroll_is_denied_and_audited():
    audit = InMemoryAuditSink()

    with pytest.raises(AuthorizationError, match="cross-company"):
        run_authorized_employee_payroll(
            actor=actor(Role.PAYROLL, company_id="company-a"),
            company_id="company-b",
            employee=employee(),
            audit=audit,
        )

    assert len(audit.events) == 1
    assert audit.events[0].allowed is False
    assert audit.events[0].resource_id == "EMP-001"
