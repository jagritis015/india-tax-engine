import pytest

from tax_engine.platform.audit import InMemoryAuditSink
from tax_engine.platform.authorization_service import (
    authorize_company,
    authorize_employee,
)
from tax_engine.platform.identity import (
    AuthenticationError,
    ExternalIdentity,
    MembershipRecord,
    resolve_actor,
)
from tax_engine.platform.repositories import InMemoryIdentityDirectory
from tax_engine.platform.tenancy import AuthorizationError, Role


def directory_with(*memberships):
    return InMemoryIdentityDirectory(list(memberships))


def membership(
    *,
    subject="subject-1",
    company_id="company-a",
    role=Role.HR,
    employee_id=None,
    active=True,
):
    return MembershipRecord(
        user_id=f"user-{subject}",
        provider="oidc",
        subject=subject,
        company_id=company_id,
        role=role,
        employee_id=employee_id,
        active=active,
    )


def test_verified_external_identity_resolves_to_tenant_actor():
    actor = resolve_actor(
        ExternalIdentity(provider="oidc", subject="subject-1"),
        directory_with(membership()),
    )

    assert actor.user_id == "user-subject-1"
    assert actor.company_id == "company-a"
    assert actor.role is Role.HR


def test_unknown_or_inactive_identity_is_rejected():
    directory = directory_with(membership(active=False))

    with pytest.raises(AuthenticationError):
        resolve_actor(ExternalIdentity(provider="oidc", subject="missing"), directory)

    with pytest.raises(AuthenticationError):
        resolve_actor(ExternalIdentity(provider="oidc", subject="subject-1"), directory)


def test_employee_membership_requires_and_preserves_employee_scope():
    actor = resolve_actor(
        ExternalIdentity(provider="oidc", subject="employee-subject"),
        directory_with(
            membership(
                subject="employee-subject",
                role=Role.EMPLOYEE,
                employee_id="employee-1",
            )
        ),
    )

    assert actor.employee_id == "employee-1"


def test_duplicate_provider_subject_mapping_is_rejected():
    directory = directory_with(membership())

    with pytest.raises(ValueError, match="already mapped"):
        directory.save(membership())


def test_company_authorization_records_allowed_and_denied_decisions():
    audit = InMemoryAuditSink()
    actor = resolve_actor(
        ExternalIdentity(provider="oidc", subject="subject-1"),
        directory_with(membership()),
    )

    authorize_company(
        actor,
        company_id="company-a",
        action="view_payroll",
        audit=audit,
    )

    with pytest.raises(AuthorizationError, match="cross-company"):
        authorize_company(
            actor,
            company_id="company-b",
            action="view_payroll",
            audit=audit,
        )

    assert [event.allowed for event in audit.events] == [True, False]
    assert audit.events[-1].reason == "cross-company access denied"


def test_employee_self_service_denial_is_audited():
    audit = InMemoryAuditSink()
    actor = resolve_actor(
        ExternalIdentity(provider="oidc", subject="employee-subject"),
        directory_with(
            membership(
                subject="employee-subject",
                role=Role.EMPLOYEE,
                employee_id="employee-1",
            )
        ),
    )

    authorize_employee(
        actor,
        company_id="company-a",
        employee_id="employee-1",
        action="view_payslip",
        audit=audit,
    )

    with pytest.raises(AuthorizationError, match="employee access denied"):
        authorize_employee(
            actor,
            company_id="company-a",
            employee_id="employee-2",
            action="view_payslip",
            audit=audit,
        )

    assert audit.events[0].allowed is True
    assert audit.events[1].allowed is False
    assert audit.events[1].resource_id == "employee-2"
