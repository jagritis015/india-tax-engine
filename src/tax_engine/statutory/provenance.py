from dataclasses import dataclass
from datetime import date
from enum import Enum

from tax_engine.statutory.law import IncomeTaxAct


class SourceAuthority(str, Enum):
    """Authority class for evidence supporting a statutory rule."""

    ACT = "act"
    RULES = "rules"
    GAZETTE_NOTIFICATION = "gazette_notification"
    OFFICIAL_CIRCULAR = "official_circular"
    OFFICIAL_GUIDANCE = "official_guidance"


@dataclass(frozen=True)
class StatutorySource:
    """Immutable citation metadata for an authoritative statutory source."""

    authority: SourceAuthority
    title: str
    reference: str
    source_url: str
    published_on: date | None = None

    def __post_init__(self) -> None:
        if not self.title.strip():
            raise ValueError("source title must not be empty")
        if not self.reference.strip():
            raise ValueError("source reference must not be empty")
        if not self.source_url.startswith("https://"):
            raise ValueError("statutory source must use an HTTPS URL")


@dataclass(frozen=True)
class StatutoryRuleProvenance:
    """Version and evidence attached to one deterministic statutory rule."""

    rule_id: str
    rule_version: str
    act: IncomeTaxAct
    effective_from: date
    effective_to: date | None
    sources: tuple[StatutorySource, ...]

    def __post_init__(self) -> None:
        if not self.rule_id.strip():
            raise ValueError("rule_id must not be empty")
        if not self.rule_version.strip():
            raise ValueError("rule_version must not be empty")
        if self.effective_to is not None and self.effective_to < self.effective_from:
            raise ValueError("effective_to cannot precede effective_from")
        if not self.sources:
            raise ValueError("every statutory rule requires at least one authoritative source")

    def applies_on(self, on_date: date) -> bool:
        if on_date < self.effective_from:
            return False
        return self.effective_to is None or on_date <= self.effective_to

    @property
    def evidence_refs(self) -> tuple[str, ...]:
        return tuple(source.reference for source in self.sources)
