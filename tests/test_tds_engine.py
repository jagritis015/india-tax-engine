from datetime import date
from decimal import Decimal

from tax_engine.payroll.employee import EmployeePayrollInput, TaxRegime
from tax_engine.tds.tds_engine import calculate_employee_tds


def test_end_to_end_new_regime_employee_tds():
    employee = EmployeePayrollInput(
        employee_id="EMP001",
        employee_name="Test Employee",
        pan="ABCDE1234F",
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("100000"),
        hra=Decimal("0"),
        special_allowance=Decimal("0"),

        taxable_salary_ytd=Decimal("400000"),
        tds_deducted_ytd=Decimal("0"),

        payroll_month=8,
        tax_year="2026-27",

        pf_applicable=True,
        pf_wages=Decimal("100000"),
    )

    result = calculate_employee_tds(employee)

    assert result["regime"] == "new"
    assert result["projected_salary"] == Decimal("1200000")
    assert result["taxable_salary"] == Decimal("1125000")
    assert result["annual_tax_liability"] == Decimal("0")
    assert result["current_month_tds"] == Decimal("0")


def test_end_to_end_employee_with_prior_tds():
    employee = EmployeePayrollInput(
        employee_id="EMP002",
        employee_name="Test Employee 2",
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("150000"),

        taxable_salary_ytd=Decimal("600000"),
        tds_deducted_ytd=Decimal("20000"),

        payroll_month=8,
        tax_year="2026-27",
    )

    result = calculate_employee_tds(employee)

    assert result["projected_salary"] == Decimal("1800000")
    assert result["taxable_salary"] == Decimal("1725000")
    assert result["annual_tax_liability"] > Decimal("0")
    assert result["current_month_tds"] >= Decimal("0")


def test_high_income_employee_tds_includes_surcharge_and_cess():
    employee = EmployeePayrollInput(
        employee_id="HIGH001",
        employee_name="High Income Employee",
        pan="ABCDE1234F",
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("500000"),
        special_allowance=Decimal("100000"),

        taxable_salary_ytd=Decimal("2400000"),
        tds_deducted_ytd=Decimal("0"),

        payroll_month=8,
        tax_year="2026-27",

        pf_applicable=False,
    )

    result = calculate_employee_tds(employee)

    annual = result["annual_tax_breakdown"]

    assert result["projected_salary"] == Decimal("7200000")
    assert annual["surcharge_rate"] == Decimal("0.10")
    assert annual["surcharge"] > Decimal("0")

    assert annual["cess"] == (
        annual["tax_after_rebate"]
        + annual["surcharge"]
    ) * Decimal("0.04")

    assert result["current_month_tds"] > Decimal("0")


def test_declared_other_income_increases_estimated_total_income():
    employee = EmployeePayrollInput(
        employee_id="OTHER001",
        employee_name="Other Income Employee",
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("100000"),
        taxable_salary_ytd=Decimal("400000"),

        other_income_declared=Decimal("200000"),
        other_income_declared_by_employee=True,

        payroll_month=8,
        tax_year="2026-27",

        pf_applicable=False,
    )

    result = calculate_employee_tds(employee)

    assert result["declared_other_income"] == Decimal("200000")

    assert result["estimated_total_income"] == (
        result["taxable_salary"]
        + Decimal("200000")
    )


def test_new_regime_house_property_loss_does_not_reduce_income():
    employee = EmployeePayrollInput(
        employee_id="HOUSE001",
        employee_name="House Property Employee",
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("150000"),
        taxable_salary_ytd=Decimal("600000"),

        house_property_income_or_loss=Decimal("-100000"),
        house_property_evidence_verified=True,

        payroll_month=8,
        tax_year="2026-27",

        pf_applicable=False,
    )

    result = calculate_employee_tds(employee)

    assert result["house_property_adjustment"] == Decimal("0")

    assert result["estimated_total_income"] == (
        result["taxable_salary"]
    )

    assert result["status"] == "CALCULATED"


def test_unverified_house_property_loss_requires_review():
    employee = EmployeePayrollInput(
        employee_id="HOUSE002",
        employee_name="Unverified House Employee",
        date_of_joining=date(2026, 4, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("150000"),
        taxable_salary_ytd=Decimal("600000"),

        house_property_income_or_loss=Decimal("-100000"),
        house_property_evidence_verified=False,

        payroll_month=8,
        tax_year="2026-27",

        pf_applicable=False,
    )

    result = calculate_employee_tds(employee)

    assert result["house_property_adjustment"] == Decimal("0")
    assert result["status"] == "REVIEW_REQUIRED"


def test_unverified_previous_employer_tds_not_credited():
    employee = EmployeePayrollInput(
        employee_id="PREV001",
        employee_name="Previous Employer Employee",
        date_of_joining=date(2026, 8, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("150000"),

        previous_employer_taxable_salary=Decimal("600000"),
        previous_employer_tds=Decimal("50000"),
        previous_employer_details_verified=False,

        payroll_month=8,
        tax_year="2026-27",

        pf_applicable=False,
    )

    result = calculate_employee_tds(employee)

    assert result["previous_employer_tds_credit"] == Decimal("0")
    assert result["status"] == "REVIEW_REQUIRED"


def test_verified_previous_employer_tds_is_credited():
    employee = EmployeePayrollInput(
        employee_id="PREV002",
        employee_name="Verified Previous Employer Employee",
        date_of_joining=date(2026, 8, 1),
        work_state="Karnataka",
        tax_regime=TaxRegime.NEW,
        regime_declared=True,

        basic_salary=Decimal("150000"),

        previous_employer_taxable_salary=Decimal("600000"),
        previous_employer_tds=Decimal("50000"),
        previous_employer_details_verified=True,

        payroll_month=8,
        tax_year="2026-27",

        pf_applicable=False,
    )

    result = calculate_employee_tds(employee)

    assert result["previous_employer_tds_credit"] == Decimal("50000")
    assert result["status"] == "CALCULATED"
