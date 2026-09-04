import sqlite3

import pytest

from tax_engine.platform.audit import AccessAuditEvent
from tax_engine.platform.identity import ExternalIdentity, MembershipRecord, resolve_actor
from tax_engine.platform.sqlite_store import SQLitePlatformStore
from tax_engine.platform.tenancy import Role


def membership(**overrides):
    values = {
        "user_id": "user-1",
        "provider": "oidc",
        "subject": "subject-1",
        "company_id": "company-a",
        "role": Role.HR,
    }
    values.update(overrides)
    return MembershipRecord(**values)


def provision(store: SQLitePlatformStore) -> None:
    store.save_company(company_id="company-a", name="Company A")
    store.save_user(user_id="user-1", email="user@example.com")


def test_sqlite_identity_survives_reopen(tmp_path):
    database = tmp_path / "platform.db"
    with SQLitePlatformStore(database) as store:
        provision(store)
        store.save(membership())

    with SQLitePlatformStore(database) as store:
        actor = resolve_actor(
            ExternalIdentity(provider="oidc", subject="subject-1"),
            store,
        )

    assert actor.user_id == "user-1"
    assert actor.company_id == "company-a"
    assert actor.role is Role.HR


def test_database_rejects_duplicate_identity_and_unknown_tenant(tmp_path):
    with SQLitePlatformStore(tmp_path / "platform.db") as store:
        provision(store)
        store.save(membership())

        with pytest.raises(ValueError, match="already mapped"):
            store.save(membership())

        with pytest.raises(ValueError, match="unknown user or company"):
            store.save(membership(subject="subject-2", company_id="missing"))


@pytest.mark.parametrize("inactive_record", ["membership", "user", "company"])
def test_inactive_identity_boundary_cannot_resolve_actor(tmp_path, inactive_record):
    with SQLitePlatformStore(tmp_path / f"{inactive_record}.db") as store:
        company_active = inactive_record != "company"
        user_active = inactive_record != "user"
        membership_active = inactive_record != "membership"
        store.save_company(
            company_id="company-a",
            name="Company A",
            active=company_active,
        )
        store.save_user(user_id="user-1", active=user_active)
        store.save(membership(active=membership_active))

        assert store.find_membership(provider="oidc", subject="subject-1") is None


def test_employee_scope_is_enforced_by_database_constraint(tmp_path):
    with SQLitePlatformStore(tmp_path / "platform.db") as store:
        provision(store)

        with pytest.raises(ValueError, match="unknown user or company"):
            store.save(membership(role=Role.EMPLOYEE))


def test_audit_events_are_immutable_and_tenant_filtered(tmp_path):
    database = tmp_path / "platform.db"
    event = AccessAuditEvent(
        user_id="user-1",
        company_id="company-a",
        action="run_payroll",
        resource_type="employee",
        resource_id="employee-1",
        allowed=False,
        reason="employee access denied",
    )
    with SQLitePlatformStore(database) as store:
        store.record(event)
        store.record(event.model_copy(update={"company_id": "company-b"}))

    with SQLitePlatformStore(database) as store:
        events = store.list_audit_events(company_id="company-a")
        with pytest.raises(sqlite3.IntegrityError, match="immutable"):
            store._connection.execute(
                "UPDATE access_audit_events SET allowed = 1 WHERE event_id = 1"
            )
        with pytest.raises(sqlite3.IntegrityError, match="immutable"):
            store._connection.execute(
                "DELETE FROM access_audit_events WHERE event_id = 1"
            )

    assert events == [event]
