from enum import Enum

from tax_engine.platform.tenancy import ActorContext, AuthorizationError, Role


class Permission(str, Enum):
    RUN_EMPLOYEE_PAYROLL = "run_employee_payroll"
    RUN_COMPANY_COMPLIANCE = "run_company_compliance"


_PERMISSION_ROLES: dict[Permission, set[Role]] = {
    Permission.RUN_EMPLOYEE_PAYROLL: {
        Role.HR,
        Role.PAYROLL,
        Role.ADMIN,
    },
    Permission.RUN_COMPANY_COMPLIANCE: {
        Role.PAYROLL,
        Role.COMPLIANCE,
        Role.ADMIN,
    },
}


def assert_permission(actor: ActorContext, permission: Permission) -> None:
    """Enforce action-level RBAC independently from tenant/resource scope."""

    allowed_roles = _PERMISSION_ROLES[permission]
    if actor.role not in allowed_roles:
        raise AuthorizationError(
            f"role {actor.role.value} is not permitted to {permission.value}"
        )
