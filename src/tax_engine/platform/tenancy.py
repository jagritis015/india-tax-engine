from enum import Enum

from pydantic import BaseModel, Field, model_validator


class Role(str, Enum):
    EMPLOYEE = "employee"
    HR = "hr"
    PAYROLL = "payroll"
    FINANCE = "finance"
    COMPLIANCE = "compliance"
    ADMIN = "admin"
    LEADERSHIP = "leadership"


class AuthorizationError(PermissionError):
    """Raised when an actor crosses an explicit company or employee boundary."""


class ActorContext(BaseModel):
    """Authorization context passed to application and AI tool boundaries.

    `company_id` is the tenant boundary. Employee actors must also carry their
    own `employee_id`; company-level roles intentionally do not need one.
    """

    user_id: str = Field(min_length=1)
    company_id: str = Field(min_length=1)
    role: Role
    employee_id: str | None = None

    @model_validator(mode="after")
    def employee_role_requires_employee_id(self):
        if self.role is Role.EMPLOYEE and not self.employee_id:
            raise ValueError("employee role requires employee_id")
        return self


_COMPANY_WIDE_ROLES = {
    Role.HR,
    Role.PAYROLL,
    Role.FINANCE,
    Role.COMPLIANCE,
    Role.ADMIN,
    Role.LEADERSHIP,
}


def assert_company_access(actor: ActorContext, *, company_id: str) -> None:
    """Enforce the tenant boundary before any company-scoped data/tool access."""

    if actor.company_id != company_id:
        raise AuthorizationError("cross-company access denied")


def assert_employee_access(
    actor: ActorContext,
    *,
    company_id: str,
    employee_id: str,
) -> None:
    """Enforce tenant and employee-level authorization.

    Company-wide operational roles may access employees in their own company.
    Employees may access only their own employee record. This function belongs
    at the data/tool boundary so conversational interfaces cannot bypass it.
    """

    assert_company_access(actor, company_id=company_id)

    if actor.role in _COMPANY_WIDE_ROLES:
        return

    if actor.role is Role.EMPLOYEE and actor.employee_id == employee_id:
        return

    raise AuthorizationError("employee access denied")
