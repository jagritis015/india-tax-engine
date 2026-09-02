from datetime import datetime, timezone
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field


class AccessAuditEvent(BaseModel):
    """Immutable security event emitted at privileged authorization boundaries."""

    model_config = ConfigDict(frozen=True)

    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: str = Field(min_length=1)
    company_id: str = Field(min_length=1)
    action: str = Field(min_length=1)
    resource_type: str = Field(min_length=1)
    resource_id: str = Field(min_length=1)
    allowed: bool
    reason: str | None = None


class AuditSink(Protocol):
    def record(self, event: AccessAuditEvent) -> None: ...


class InMemoryAuditSink:
    """Test/development sink; production adapters can persist the same contract."""

    def __init__(self) -> None:
        self.events: list[AccessAuditEvent] = []

    def record(self, event: AccessAuditEvent) -> None:
        self.events.append(event)
