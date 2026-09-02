from tax_engine.payroll.employee import EmployeePayrollInput
from tax_engine.platform.audit import AccessAuditEvent, AuditSink
from tax_engine.platform.authorization_service import authorize_employee
from tax_engine.platform.permissions import Permission, assert_permission
from tax_engine.platform.tenancy import ActorContext, AuthorizationError
from tax_engine.services.payroll_service import run_employee_payroll


def run_authorized_employee_payroll(
    *,
    actor: ActorContext,
    company_id: str,
    employee: EmployeePayrollInput,
    audit: AuditSink,
) -> dict:
    """Authorized application boundary for deterministic employee payroll.

    Action-level RBAC is checked before employee scope. Only after both pass is
    the deterministic payroll engine invoked. APIs, UI flows, and AI tools
    should use this boundary rather than calling the calculation service
    directly when operating on tenant data.
    """

    action = Permission.RUN_EMPLOYEE_PAYROLL.value

    try:
        assert_permission(actor, Permission.RUN_EMPLOYEE_PAYROLL)
    except AuthorizationError as exc:
        audit.record(
            AccessAuditEvent(
                user_id=actor.user_id,
                company_id=actor.company_id,
                action=action,
                resource_type="employee",
                resource_id=employee.employee_id,
                allowed=False,
                reason=str(exc),
            )
        )
        raise

    authorize_employee(
        actor,
        company_id=company_id,
        employee_id=employee.employee_id,
        action=action,
        audit=audit,
    )

    return run_employee_payroll(employee)
