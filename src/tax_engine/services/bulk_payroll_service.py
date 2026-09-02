from datetime import datetime
from decimal import Decimal

import pandas as pd

from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    Sex,
    TaxRegime,
)
from tax_engine.services.payroll_service import run_employee_payroll


def _decimal(value) -> Decimal:
    if pd.isna(value) or value == "":
        return Decimal("0")
    return Decimal(str(value))


def _optional_bool(value):
    if pd.isna(value) or value == "":
        return None

    normalized = str(value).strip().lower()

    if normalized in {"true", "yes", "1"}:
        return True

    if normalized in {"false", "no", "0"}:
        return False

    raise ValueError(f"Invalid boolean value: {value}")


def _bool(value, default=False):
    parsed = _optional_bool(value)
    return default if parsed is None else parsed


def _sex(value):
    normalized = str(value).strip().lower()

    mapping = {
        "male": Sex.MALE,
        "female": Sex.FEMALE,
        "other": Sex.OTHER,
    }

    if normalized not in mapping:
        raise ValueError(f"Invalid sex: {value}")

    return mapping[normalized]


def _regime(value):
    normalized = str(value).strip().lower()

    mapping = {
        "new": TaxRegime.NEW,
        "old": TaxRegime.OLD,
    }

    if normalized not in mapping:
        raise ValueError(f"Invalid tax regime: {value}")

    return mapping[normalized]



def _decimal_or_none(value):
    """
    Convert optional numeric CSV values to Decimal.

    Blank cells and pandas NaN values are treated as missing.
    """
    if value is None:
        return None

    try:
        import pandas as pd

        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    text = str(value).strip()

    if text.lower() in {
        "",
        "nan",
        "none",
        "null",
        "nat",
    }:
        return None

    return Decimal(text)


def employee_from_row(row) -> EmployeePayrollInput:
    return EmployeePayrollInput(
        employee_id=str(row["employee_id"]),
        employee_name=str(row["employee_name"]),

        pan=(
            None
            if pd.isna(row.get("pan"))
            else str(row.get("pan"))
        ),

        sex=_sex(row["sex"]),

        date_of_joining=datetime.strptime(
            str(row["date_of_joining"]),
            "%Y-%m-%d",
        ).date(),

        work_state=str(row["work_state"]),

        tax_regime=_regime(row["tax_regime"]),
        regime_declared=_bool(
            row.get("regime_declared"),
            default=True,
        ),

        basic_salary=_decimal(row.get("basic_salary")),
        dearness_allowance=_decimal(
            row.get("dearness_allowance")
        ),
        hra=_decimal(row.get("hra")),
        special_allowance=_decimal(
            row.get("special_allowance")
        ),
        bonus=_decimal(row.get("bonus")),
        commission=_decimal(row.get("commission")),
        other_taxable_earnings=_decimal(
            row.get("other_taxable_earnings")
        ),

        taxable_salary_ytd=_decimal(
            row.get("taxable_salary_ytd")
        ),
        tds_deducted_ytd=_decimal(
            row.get("tds_deducted_ytd")
        ),

        previous_employer_taxable_salary=_decimal(
            row.get("previous_employer_taxable_salary")
        ),
        previous_employer_tds=_decimal(
            row.get("previous_employer_tds")
        ),
        previous_employer_details_verified=_bool(
            row.get("previous_employer_details_verified")
        ),

        other_income_declared=_decimal(
            row.get("other_income_declared")
        ),
        other_income_declared_by_employee=_bool(
            row.get("other_income_declared_by_employee")
        ),

        pf_applicable=_optional_bool(
            row.get("pf_applicable")
        ),
        pf_wages=(
            None
            if pd.isna(row.get("pf_wages"))
            else _decimal(row.get("pf_wages"))
        ),
        prior_epf_member=_bool(
            row.get("prior_epf_member")
        ),

        pt_annual_salary_or_wages=(
            _decimal_or_none(
                row.get("pt_annual_salary_or_wages")
            )
        ),
        pt_half_year_salary_or_wages=(
            None
            if pd.isna(
                row.get("pt_half_year_salary_or_wages")
            )
            else _decimal(
                row.get("pt_half_year_salary_or_wages")
            )
        ),

        pt_days_employed_in_half_year=(
            None
            if pd.isna(
                row.get("pt_days_employed_in_half_year")
            )
            else int(
                row.get("pt_days_employed_in_half_year")
            )
        ),

        pt_already_deducted_for_half_year=_decimal(
            row.get(
                "pt_already_deducted_for_half_year"
            )
        ),

        payroll_month=int(row["payroll_month"]),
        tax_year=str(row["tax_year"]),
    )


def run_bulk_payroll(df: pd.DataFrame) -> pd.DataFrame:
    results = []

    for _, row in df.iterrows():
        try:
            employee = employee_from_row(row)
            payroll = run_employee_payroll(employee)

            results.append({
                "employee_id": employee.employee_id,
                "employee_name": employee.employee_name,
                "status": payroll["status"],
                "gross_salary": payroll["gross_salary"],
                "tds": payroll["tds"],
                "employee_pf": payroll["employee_pf"],
                "professional_tax": payroll[
                    "professional_tax"
                ],
                "total_deductions": payroll[
                    "total_deductions"
                ],
                "net_salary": payroll["net_salary"],
                "review_reason": (
                    (payroll.get("pt_breakdown") or {}).get(
                        "review_reason"
                    )
                    if payroll["status"] == "REVIEW_REQUIRED"
                    else None
                ),
                "error": None,
            })

        except Exception as exc:
            results.append({
                "employee_id": row.get(
                    "employee_id",
                    "UNKNOWN",
                ),
                "employee_name": row.get(
                    "employee_name",
                    "UNKNOWN",
                ),
                "status": "BLOCKED",
                "gross_salary": None,
                "tds": None,
                "employee_pf": None,
                "professional_tax": None,
                "total_deductions": None,
                "net_salary": None,
                "review_reason": None,
                "error": str(exc),
            })

    return pd.DataFrame(results)
