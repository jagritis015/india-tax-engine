import pytest
from pydantic import ValidationError

from tax_engine.platform.tenancy import (
    ActorContext,
    AuthorizationError,
    Role,
    assert_company_access,
    assert_employee_access,
)


def actor(role: Role, *, company_id="company-a", employee_id=None):
    return ActorContext(
        user_id="user-1",
        company_id=company_id,
        role=role,
        employee_id=employee_id,
    )


def test_employee_role_requires_employee_identity():
    with pytest.raises(ValidationError):
        actor(Role.EMPLOYEE)


def test_company_boundary_rejects_cross_tenant_access():
    with pytest.raises(AuthorizationError, match="cross-company"):
        assert_company_access(actor(Role.ADMIN), company_id="company-b")


@pytest.mark.parametrize(
    "role",
    [
        Role.HR,
        Role.PAYROLL,
        Role.FINANCE,
        Role.COMPLIANCE,
        Role.ADMIN,
        Role.LEADERSHIP,
    ],
)
def test_company_roles_can_access_employee_inside_same_tenant(role):
    assert_employee_access(
        actor(role),
        company_id="company-a",
        employee_id="employee-2",
    )


def test_employee_can_access_only_self():
    employee = actor(Role.EMPLOYEE, employee_id="employee-1")

    assert_employee_access(
        employee,
        company_id="company-a",
        employee_id="employee-1",
    )

    with pytest.raises(AuthorizationError, match="employee access denied"):
        assert_employee_access(
            employee,
            company_id="company-a",
            employee_id="employee-2",
        )


def test_employee_cannot_escape_tenant_even_with_matching_employee_id():
    with pytest.raises(AuthorizationError, match="cross-company"):
        assert_employee_access(
            actor(Role.EMPLOYEE, employee_id="employee-1"),
            company_id="company-b",
            employee_id="employee-1",
        )
