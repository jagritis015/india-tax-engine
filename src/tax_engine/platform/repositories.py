from tax_engine.platform.identity import MembershipRecord


class InMemoryIdentityDirectory:
    """Deterministic identity directory for tests and local development.

    Production persistence adapters should implement the same find_membership
    contract against the application database.
    """

    def __init__(self, memberships: list[MembershipRecord] | None = None) -> None:
        self._memberships: dict[tuple[str, str], MembershipRecord] = {}
        for membership in memberships or []:
            self.save(membership)

    def save(self, membership: MembershipRecord) -> None:
        key = (membership.provider, membership.subject)
        if key in self._memberships:
            raise ValueError("provider subject is already mapped")
        self._memberships[key] = membership

    def find_membership(
        self,
        *,
        provider: str,
        subject: str,
    ) -> MembershipRecord | None:
        return self._memberships.get((provider, subject))
