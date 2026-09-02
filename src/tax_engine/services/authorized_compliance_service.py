import pandas as pd

from tax_engine.platform.audit import AccessAuditEvent, AuditSink
from tax_engine.platform.authorization_service import authorize_company
from tax_engine.platform.permissions import Permission, assert_permission
from tax_engine.platform.tenancy import ActorContext, AuthorizationError
from tax_engine.services.compliance_run_service import (
    CompanyComplianceRun,
    process_company_compliance_file,
)


def run_authorized_company_compliance(
    *,
    actor: ActorContext,
    company_id: str,
    dataframe: pd.DataFrame,
    audit: AuditSink,
) -> CompanyComplianceRun:
    """Authorized company boundary for deterministic compliance execution.

    Action-level RBAC and tenant scope are enforced before uploaded payroll data
    reaches the compliance engine. APIs, UI flows, and AI tools should call this
    boundary for tenant-scoped company compliance runs.
    """

    action = Permission.RUN_COMPANY_COMPLIANCE.value

    try:
        assert_permission(actor, Permission.RUN_COMPANY_COMPLIANCE)
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

    authorize_company(
        actor,
        company_id=company_id,
        action=action,
        audit=audit,
    )

    return process_company_compliance_file(dataframe)
