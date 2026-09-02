from datetime import date
from decimal import Decimal

from tax_engine.ai.tools import (
    build_payroll_explanation_context,
    calculate_payroll_tool,
)
from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    TaxRegime,
)
from tax_engine.services.payroll_service import run_employee_payroll


def make_employee(
    *,
    state: str = "Gujarat",
) -> EmployeePayrollInput:
    return EmployeePayrollInput(
        employee_id="AI001",
        employee_name="AI Contract Test",
        pan="ABCDE1234F",
        date_of_joining=date(2026, 4, 1),
        work_state=state,
        tax_regime=TaxRegime.NEW,
        regime_declared=True,
        basic_salary=Decimal("50000"),
        pf_applicable=False,
        payroll_month=4,
        tax_year="2026-27",
    )


def test_ai_tool_matches_deterministic_service():
    employee = make_employee()

    engine = run_employee_payroll(employee)
    tool = calculate_payroll_tool(employee)

    assert tool.status == engine["status"]

    assert tool.summary["gross_salary"] == engine["gross_salary"]
    assert tool.summary["tds"] == engine["tds"]
    assert tool.summary["employee_pf"] == engine["employee_pf"]
    assert (
        tool.summary["professional_tax"]
        == engine["professional_tax"]
    )
    assert (
        tool.summary["total_deductions"]
        == engine["total_deductions"]
    )
    assert tool.summary["net_salary"] == engine["net_salary"]


def test_ai_boundary_declares_engine_as_source():
    tool = calculate_payroll_tool(make_employee())

    assert tool.source == "DETERMINISTIC_ENGINE"
    assert tool.ai_calculated_amounts is False


def test_unverified_pt_cannot_be_promoted_to_calculated():
    employee = make_employee(state="Tamil Nadu")

    engine = run_employee_payroll(employee)
    tool = calculate_payroll_tool(employee)

    assert engine["status"] == "REVIEW_REQUIRED"
    assert tool.status == "REVIEW_REQUIRED"

    assert tool.summary["professional_tax"] is None
    assert tool.summary["total_deductions"] is None
    assert tool.summary["net_salary"] is None

    assert tool.review_reasons


def test_explanation_context_contains_engine_values_only():
    employee = make_employee()

    engine = run_employee_payroll(employee)
    context = build_payroll_explanation_context(employee)

    assert context.status == engine["status"]
    assert context.gross_salary == engine["gross_salary"]
    assert context.tds == engine["tds"]
    assert context.employee_pf == engine["employee_pf"]
    assert (
        context.professional_tax
        == engine["professional_tax"]
    )
    assert (
        context.total_deductions
        == engine["total_deductions"]
    )
    assert context.net_salary == engine["net_salary"]


def test_explanation_context_preserves_review_required():
    employee = make_employee(state="Tamil Nadu")

    context = build_payroll_explanation_context(employee)

    assert context.status == "REVIEW_REQUIRED"
    assert context.professional_tax is None
    assert context.total_deductions is None
    assert context.net_salary is None
