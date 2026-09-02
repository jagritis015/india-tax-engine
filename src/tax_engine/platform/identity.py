from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from tax_engine.platform.tenancy import ActorContext, Role


class ExternalIdentity(BaseModel):
    """Verified identity-provider claims accepted by the application boundary."""

    model_config = ConfigDict(frozen=True)

    provider: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    email: str | None = None


class MembershipRecord(BaseModel):
    """Persisted mapping from an external identity to one tenant-scoped role."""

    model_config = ConfigDict(frozen=True)

    user_id: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    company_id: str = Field(min_length=1)
    role: Role
    employee_id: str | None = None
    active: bool = True


class IdentityDirectory(Protocol):
    def find_membership(self, *, provider: str, subject: str) -> MembershipRecord | None: ...


class AuthenticationError(PermissionError):
    """Raised when verified provider claims cannot resolve to an active membership."""


def resolve_actor(identity: ExternalIdentity, directory: IdentityDirectory) -> ActorContext:
    membership = directory.find_membership(
        provider=identity.provider,
        subject=identity.subject,
    )

    if membership is None or not membership.active:
        raise AuthenticationError("identity is not authorized for this platform")

    return ActorContext(
        user_id=membership.user_id,
        company_id=membership.company_id,
        role=membership.role,
        employee_id=membership.employee_id,
    )
