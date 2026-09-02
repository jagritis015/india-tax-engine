from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    TaxRegime,
)
from tax_engine.professional_tax.models import PTStatus
from tax_engine.services.payroll_service import (
    run_employee_payroll,
)


def make_delhi_employee() -> EmployeePayrollInput:
    return EmployeePayrollInput(
        employee_id="DEL001",
        employee_name="Delhi PT Test",
        pan="ABCDE1234F",
        date_of_joining=date(2026, 4, 1),
        work_state="Delhi",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        basic_salary=Decimal("160000"),
        pf_applicable=False,
        payroll_month=8,
        tax_year="2026-27",
    )


def test_delhi_pt_is_locked_not_applicable():
    result = run_employee_payroll(
        make_delhi_employee()
    )

    assert result["professional_tax"] == Decimal("0")

    pt = result["pt_breakdown"]

    assert pt["status"] == PTStatus.NOT_APPLICABLE
    assert pt["review_reason"] is None


def test_delhi_pt_does_not_block_payroll():
    result = run_employee_payroll(
        make_delhi_employee()
    )

    assert result["status"] != "REVIEW_REQUIRED"
    assert result["professional_tax"] == Decimal("0")
