from unittest.mock import patch

import pandas as pd
import pytest

from tax_engine.platform.audit import InMemoryAuditSink
from tax_engine.platform.tenancy import ActorContext, AuthorizationError, Role
from tax_engine.services.authorized_compliance_service import (
    run_authorized_company_compliance,
)
from tax_engine.services.compliance_run_service import CompanyComplianceRun


def actor(role: Role, *, company_id="company-a", employee_id=None) -> ActorContext:
    return ActorContext(
        user_id="user-1",
        company_id=company_id,
        role=role,
        employee_id=employee_id,
    )


def compliance_result() -> CompanyComplianceRun:
    return CompanyComplianceRun(
        uploaded_records=1,
        valid_records=1,
        quarantined_records=0,
        monthly_compliance=None,
        quarantine=[],
        company_run_complete=True,
        payroll_can_be_approved=False,
    )


@pytest.mark.parametrize("role", [Role.PAYROLL, Role.COMPLIANCE, Role.ADMIN])
def test_authorized_roles_can_run_company_compliance(role):
    audit = InMemoryAuditSink()
    dataframe = pd.DataFrame({"employee_id": ["EMP-001"]})
    expected = compliance_result()

    with patch(
        "tax_engine.services.authorized_compliance_service.process_company_compliance_file",
        return_value=expected,
    ) as process:
        result = run_authorized_company_compliance(
            actor=actor(role),
            company_id="company-a",
            dataframe=dataframe,
            audit=audit,
        )

    assert result == expected
    process.assert_called_once_with(dataframe)
    assert len(audit.events) == 1
    assert audit.events[0].allowed is True
    assert audit.events[0].action == "run_company_compliance"
    assert audit.events[0].resource_type == "company"


@pytest.mark.parametrize(
    "role",
    [Role.EMPLOYEE, Role.HR, Role.FINANCE, Role.LEADERSHIP],
)
def test_unauthorized_roles_never_reach_compliance_engine(role):
    audit = InMemoryAuditSink()
    employee_id = "EMP-001" if role is Role.EMPLOYEE else None

    with patch(
        "tax_engine.services.authorized_compliance_service.process_company_compliance_file"
    ) as process:
        with pytest.raises(AuthorizationError, match="not permitted"):
            run_authorized_company_compliance(
                actor=actor(role, employee_id=employee_id),
                company_id="company-a",
                dataframe=pd.DataFrame(),
                audit=audit,
            )

    process.assert_not_called()
    assert len(audit.events) == 1
    assert audit.events[0].allowed is False


def test_cross_company_compliance_is_denied_before_engine_execution():
    audit = InMemoryAuditSink()

    with patch(
        "tax_engine.services.authorized_compliance_service.process_company_compliance_file"
    ) as process:
        with pytest.raises(AuthorizationError, match="cross-company"):
            run_authorized_company_compliance(
                actor=actor(Role.PAYROLL, company_id="company-a"),
                company_id="company-b",
                dataframe=pd.DataFrame(),
                audit=audit,
            )

    process.assert_not_called()
    assert len(audit.events) == 1
    assert audit.events[0].allowed is False
    assert audit.events[0].resource_id == "company-b"
