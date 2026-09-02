from tax_engine.platform.audit import AccessAuditEvent, AuditSink
from tax_engine.platform.tenancy import (
    ActorContext,
    AuthorizationError,
    assert_company_access,
    assert_employee_access,
)


def authorize_company(
    actor: ActorContext,
    *,
    company_id: str,
    action: str,
    audit: AuditSink,
) -> None:
    try:
        assert_company_access(actor, company_id=company_id)
    except AuthorizationError as exc:
        audit.record(
            AccessAuditEvent(
                user_id=actor.user_id,
                company_id=actor.company_id,
                action=action,
                resource_type="company",
                resource_id=company_id,
                allowed=False,
                reason=str(exc),
            )
        )
        raise

    audit.record(
        AccessAuditEvent(
            user_id=actor.user_id,
            company_id=actor.company_id,
            action=action,
            resource_type="company",
            resource_id=company_id,
            allowed=True,
        )
    )


def authorize_employee(
    actor: ActorContext,
    *,
    company_id: str,
    employee_id: str,
    action: str,
    audit: AuditSink,
) -> None:
    try:
        assert_employee_access(
            actor,
            company_id=company_id,
            employee_id=employee_id,
        )
    except AuthorizationError as exc:
        audit.record(
            AccessAuditEvent(
                user_id=actor.user_id,
                company_id=actor.company_id,
                action=action,
                resource_type="employee",
                resource_id=employee_id,
                allowed=False,
                reason=str(exc),
            )
        )
        raise

    audit.record(
        AccessAuditEvent(
            user_id=actor.user_id,
            company_id=actor.company_id,
            action=action,
            resource_type="employee",
            resource_id=employee_id,
            allowed=True,
        )
    )
