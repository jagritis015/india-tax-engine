"""Platform-level identity, tenancy, and authorization primitives."""

from tax_engine.platform.tenancy import (
    ActorContext,
    AuthorizationError,
    Role,
    assert_company_access,
    assert_employee_access,
)

__all__ = [
    "ActorContext",
    "AuthorizationError",
    "Role",
    "assert_company_access",
    "assert_employee_access",
]
