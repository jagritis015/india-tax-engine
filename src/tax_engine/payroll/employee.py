from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field


class Sex(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class TaxRegime(str, Enum):
    NEW = "new"
    OLD = "old"


class EmployeePayrollInput(BaseModel):
    # Employee identity
    employee_id: str
    employee_name: str
    pan: str | None = None

    # Employment information
    sex: Sex | None = None


    date_of_joining: date
    work_state: str
    tax_regime: TaxRegime | None = None
    regime_declared: bool = False

    # Current month's earnings
    basic_salary: Decimal = Field(default=Decimal("0"), ge=0)
    dearness_allowance: Decimal = Field(default=Decimal("0"), ge=0)
    hra: Decimal = Field(default=Decimal("0"), ge=0)
    special_allowance: Decimal = Field(default=Decimal("0"), ge=0)
    bonus: Decimal = Field(default=Decimal("0"), ge=0)
    commission: Decimal = Field(default=Decimal("0"), ge=0)
    other_taxable_earnings: Decimal = Field(default=Decimal("0"), ge=0)

    # Payroll component history for the Tax Year
    basic_salary_ytd: Decimal = Field(default=Decimal("0"), ge=0)
    dearness_allowance_ytd: Decimal = Field(default=Decimal("0"), ge=0)
    hra_ytd: Decimal = Field(default=Decimal("0"), ge=0)

    # Payroll history for the Tax Year
    taxable_salary_ytd: Decimal = Field(default=Decimal("0"), ge=0)
    tds_deducted_ytd: Decimal = Field(default=Decimal("0"), ge=0)

    # Previous employer information, if applicable
    previous_employer_taxable_salary: Decimal = Field(
        default=Decimal("0"), ge=0
    )
    previous_employer_tds: Decimal = Field(
        default=Decimal("0"), ge=0
    )

    # HRA exemption inputs
    annual_rent_paid: Decimal = Field(
        default=Decimal("0"), ge=0
    )
    hra_location: str | None = None
    da_forms_part_of_retirement_benefits: bool = False

    # Employee tax declarations
    hra_exemption_claimed: Decimal = Field(
        default=Decimal("0"), ge=0
    )
    professional_tax_paid: Decimal = Field(
        default=Decimal("0"), ge=0
    )
    deduction_80c: Decimal = Field(
        default=Decimal("0"), ge=0
    )
    deduction_80d: Decimal = Field(
        default=Decimal("0"), ge=0
    )
    deduction_nps_employee: Decimal = Field(
        default=Decimal("0"), ge=0
    )
    deduction_nps_employer: Decimal = Field(
        default=Decimal("0"), ge=0
    )

    # Additional Tax Year income inputs
    other_income_declared: Decimal = Field(
        default=Decimal("0"), ge=0
    )

    house_property_income_or_loss: Decimal = Field(
        default=Decimal("0")
    )

    taxable_perquisites_ytd: Decimal = Field(
        default=Decimal("0"), ge=0
    )

    current_month_taxable_perquisites: Decimal = Field(
        default=Decimal("0"), ge=0
    )

    projected_future_bonus: Decimal = Field(
        default=Decimal("0"), ge=0
    )

    projected_future_variable_pay: Decimal = Field(
        default=Decimal("0"), ge=0
    )

    # Declaration / evidence controls
    previous_employer_details_verified: bool = False
    other_income_declared_by_employee: bool = False
    house_property_evidence_verified: bool = False
    tax_declaration_evidence_verified: bool = False

    # PF inputs
    pf_applicable: bool | None = None
    pf_wages: Decimal | None = Field(default=None, ge=0)

    prior_epf_member: bool = False
    joining_pf_wages: Decimal | None = Field(default=None, ge=0)

    international_worker: bool = False

    contribute_on_higher_pf_wages: bool = False
    higher_pf_wage_option_verified: bool = False

    pf_contribution_rate: Decimal = Field(
        default=Decimal("0.12"), ge=0
    )

    # Professional Tax half-year context
    pt_half_year_salary_or_wages: Decimal | None = Field(
        default=None,
        ge=0,
    )

    pt_days_employed_in_half_year: int | None = Field(
        default=None,
        ge=0,
        le=184,
    )

    pt_already_deducted_for_half_year: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    # Payroll period
    payroll_month: int = Field(ge=1, le=12)
    tax_year: str = Field(pattern=r"^\d{4}-\d{2}$")
