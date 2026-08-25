from datetime import date
from decimal import Decimal

import streamlit as st

import pandas as pd

from tax_engine.services.bulk_payroll_service import (
    run_bulk_payroll,
)

from tax_engine.payroll.employee import (
    EmployeePayrollInput,
    Sex,
    TaxRegime,
)
from tax_engine.services.payroll_service import (
    run_employee_payroll,
)


st.set_page_config(
    page_title="India Payroll Engine",
    page_icon="₹",
    layout="wide",
)

st.title("India Payroll Engine")
st.caption(
    "TY 2026-27 • Employee TDS • PF • Professional Tax"
)

st.info(
    "This is the first controlled V1 interface. "
    "Verified statutory rules are calculated automatically. "
    "Unsupported or unresolved cases are marked REVIEW_REQUIRED."
)

mode = st.radio(
    "Mode",
    [
        "Single Employee",
        "Bulk Payroll",
    ],
    horizontal=True,
)

if mode == "Bulk Payroll":
    st.subheader("Bulk Payroll")

    st.caption(
        "Upload a payroll CSV. Each employee is validated "
        "and processed independently."
    )

    with open(
        "templates/payroll_upload_template.csv",
        "rb",
    ) as template_file:
        st.download_button(
            "Download CSV template",
            data=template_file,
            file_name="payroll_upload_template.csv",
            mime="text/csv",
        )

    uploaded_file = st.file_uploader(
        "Upload payroll CSV",
        type=["csv"],
    )

    if uploaded_file is not None:
        df = pd.read_csv(uploaded_file)

        st.write("Input preview")
        st.dataframe(
            df,
            use_container_width=True,
        )

        if st.button(
            "Process Bulk Payroll",
            type="primary",
        ):
            results_df = run_bulk_payroll(df)

            st.subheader("Payroll Results")

            st.dataframe(
                results_df,
                use_container_width=True,
            )

            calculated = (
                results_df["status"] == "CALCULATED"
            ).sum()

            review = (
                results_df["status"] == "REVIEW_REQUIRED"
            ).sum()

            blocked = (
                results_df["status"] == "BLOCKED"
            ).sum()

            c1, c2, c3 = st.columns(3)

            c1.metric(
                "Calculated",
                int(calculated),
            )

            c2.metric(
                "Review Required",
                int(review),
            )

            c3.metric(
                "Blocked",
                int(blocked),
            )

            csv_output = results_df.to_csv(
                index=False
            ).encode("utf-8")

            st.download_button(
                "Download payroll results",
                data=csv_output,
                file_name="payroll_results.csv",
                mime="text/csv",
            )

    st.stop()


INDIAN_STATES_UTS = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
]


def money(value):
    if value is None:
        return "—"

    value = Decimal(str(value))

    return f"₹{value:,.0f}"


with st.form("payroll_form"):

    st.subheader("Employee")

    col1, col2, col3 = st.columns(3)

    with col1:
        employee_id = st.text_input(
            "Employee ID",
            value="EMP001",
        )

        employee_name = st.text_input(
            "Employee name",
            value="Test Employee",
        )

        pan = st.text_input(
            "PAN",
            value="ABCDE1234F",
        )

    with col2:
        sex_value = st.selectbox(
            "Sex",
            ["Male", "Female", "Other"],
        )

        date_of_joining = st.date_input(
            "Date of joining",
            value=date(2026, 4, 1),
        )

        work_state = st.selectbox(
            "Work state / UT",
            INDIAN_STATES_UTS,
            index=INDIAN_STATES_UTS.index("Karnataka"),
        )

    with col3:
        tax_regime_value = st.selectbox(
            "Tax regime",
            ["New", "Old"],
        )

        regime_declared = st.checkbox(
            "Employee regime declaration received",
            value=True,
        )

        payroll_month = st.selectbox(
            "Payroll month",
            list(range(1, 13)),
            index=7,
            format_func=lambda x: {
                1: "January",
                2: "February",
                3: "March",
                4: "April",
                5: "May",
                6: "June",
                7: "July",
                8: "August",
                9: "September",
                10: "October",
                11: "November",
                12: "December",
            }[x],
        )

    st.divider()
    st.subheader("Current month salary")

    col1, col2, col3 = st.columns(3)

    with col1:
        basic_salary = st.number_input(
            "Basic salary",
            min_value=0.0,
            value=100000.0,
            step=1000.0,
        )

        hra = st.number_input(
            "HRA",
            min_value=0.0,
            value=40000.0,
            step=1000.0,
        )

    with col2:
        dearness_allowance = st.number_input(
            "Dearness allowance",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

        special_allowance = st.number_input(
            "Special allowance",
            min_value=0.0,
            value=60000.0,
            step=1000.0,
        )

    with col3:
        bonus = st.number_input(
            "Current month bonus",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

        other_taxable_earnings = st.number_input(
            "Other taxable earnings",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

    st.divider()
    st.subheader("Tax Year history")

    col1, col2, col3 = st.columns(3)

    with col1:
        taxable_salary_ytd = st.number_input(
            "Taxable salary YTD before current month",
            min_value=0.0,
            value=800000.0,
            step=1000.0,
        )

        tds_deducted_ytd = st.number_input(
            "TDS already deducted YTD",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

    with col2:
        previous_employer_taxable_salary = st.number_input(
            "Previous employer taxable salary",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

        previous_employer_tds = st.number_input(
            "Previous employer TDS",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

        previous_employer_verified = st.checkbox(
            "Previous employer details verified",
            value=False,
        )

    with col3:
        other_income = st.number_input(
            "Other declared taxable income",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

        other_income_declared = st.checkbox(
            "Other income declared by employee",
            value=False,
        )

    st.divider()
    st.subheader("PF")

    col1, col2, col3 = st.columns(3)

    with col1:
        pf_status = st.selectbox(
            "PF applicability",
            [
                "Applicable",
                "Not applicable",
                "Let engine determine",
            ],
        )

    with col2:
        pf_wages = st.number_input(
            "PF wages",
            min_value=0.0,
            value=15000.0,
            step=500.0,
        )

    with col3:
        prior_epf_member = st.checkbox(
            "Existing EPF member",
            value=True,
        )

        international_worker = st.checkbox(
            "International worker",
            value=False,
        )

    # Tamil Nadu Professional Tax context
    pt_half_year_salary_or_wages = None
    pt_days_employed_in_half_year = None
    pt_already_deducted_for_half_year = 0.0

    if work_state == "Tamil Nadu":
        st.divider()
        st.subheader("Tamil Nadu Professional Tax")

        st.caption(
            "Tamil Nadu PT is assessed half-yearly. "
            "Provide the applicable half-year payroll context."
        )

        tn_col1, tn_col2, tn_col3 = st.columns(3)

        with tn_col1:
            pt_half_year_salary_or_wages = st.number_input(
                "Half-year salary / wages",
                min_value=0.0,
                value=0.0,
                step=1000.0,
                help=(
                    "Salary or wages applicable for the current "
                    "Tamil Nadu PT half-year."
                ),
            )

        with tn_col2:
            pt_days_employed_in_half_year = st.number_input(
                "Days employed in half-year",
                min_value=0,
                max_value=184,
                value=60,
                step=1,
                help=(
                    "Tamil Nadu PT eligibility requires at least "
                    "60 aggregate days in the half-year."
                ),
            )

        with tn_col3:
            pt_already_deducted_for_half_year = st.number_input(
                "PT already deducted in half-year",
                min_value=0.0,
                value=0.0,
                step=50.0,
            )

    with st.expander("Old regime / HRA declarations"):

        annual_rent_paid = st.number_input(
            "Annual rent paid",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

        hra_location = st.text_input(
            "HRA location",
            value=work_state,
        )

        professional_tax_paid = st.number_input(
            "Professional Tax paid during TY",
            min_value=0.0,
            value=0.0,
            step=100.0,
        )

        deduction_80c = st.number_input(
            "Section 123 / eligible investment deduction",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

        deduction_80d = st.number_input(
            "Health insurance deduction",
            min_value=0.0,
            value=0.0,
            step=1000.0,
        )

    submitted = st.form_submit_button(
        "Calculate Payroll",
        type="primary",
        use_container_width=True,
    )


if submitted:

    sex_map = {
        "Male": Sex.MALE,
        "Female": Sex.FEMALE,
        "Other": Sex.OTHER,
    }

    regime_map = {
        "New": TaxRegime.NEW,
        "Old": TaxRegime.OLD,
    }

    pf_applicable_map = {
        "Applicable": True,
        "Not applicable": False,
        "Let engine determine": None,
    }

    try:
        employee = EmployeePayrollInput(
            employee_id=employee_id,
            employee_name=employee_name,
            pan=pan or None,
            sex=sex_map[sex_value],
            date_of_joining=date_of_joining,
            work_state=work_state,

            tax_regime=regime_map[tax_regime_value],
            regime_declared=regime_declared,

            basic_salary=Decimal(str(basic_salary)),
            dearness_allowance=Decimal(
                str(dearness_allowance)
            ),
            hra=Decimal(str(hra)),
            special_allowance=Decimal(
                str(special_allowance)
            ),
            bonus=Decimal(str(bonus)),
            other_taxable_earnings=Decimal(
                str(other_taxable_earnings)
            ),

            taxable_salary_ytd=Decimal(
                str(taxable_salary_ytd)
            ),
            tds_deducted_ytd=Decimal(
                str(tds_deducted_ytd)
            ),

            previous_employer_taxable_salary=Decimal(
                str(previous_employer_taxable_salary)
            ),
            previous_employer_tds=Decimal(
                str(previous_employer_tds)
            ),
            previous_employer_details_verified=(
                previous_employer_verified
            ),

            other_income_declared=Decimal(
                str(other_income)
            ),
            other_income_declared_by_employee=(
                other_income_declared
            ),

            annual_rent_paid=Decimal(
                str(annual_rent_paid)
            ),
            hra_location=hra_location or None,
            professional_tax_paid=Decimal(
                str(professional_tax_paid)
            ),
            deduction_80c=Decimal(
                str(deduction_80c)
            ),
            deduction_80d=Decimal(
                str(deduction_80d)
            ),

            pf_applicable=pf_applicable_map[
                pf_status
            ],
            pf_wages=Decimal(str(pf_wages)),
            prior_epf_member=prior_epf_member,
            international_worker=international_worker,

            pt_half_year_salary_or_wages=(
                None
                if pt_half_year_salary_or_wages is None
                else Decimal(
                    str(pt_half_year_salary_or_wages)
                )
            ),
            pt_days_employed_in_half_year=(
                None
                if pt_days_employed_in_half_year is None
                else int(pt_days_employed_in_half_year)
            ),
            pt_already_deducted_for_half_year=Decimal(
                str(pt_already_deducted_for_half_year)
            ),

            payroll_month=payroll_month,
            tax_year="2026-27",
        )

        result = run_employee_payroll(
            employee
        )

        st.divider()
        st.header("Payroll Result")

        if result["status"] == "CALCULATED":
            st.success("CALCULATED")
        else:
            st.warning(
                "REVIEW REQUIRED — one or more statutory "
                "inputs/rules require verification."
            )

        c1, c2, c3, c4 = st.columns(4)

        c1.metric(
            "Gross Salary",
            money(result["gross_salary"]),
        )

        c2.metric(
            "TDS",
            money(result["tds"]),
        )

        c3.metric(
            "Employee PF",
            money(result["employee_pf"]),
        )

        c4.metric(
            "Professional Tax",
            money(result["professional_tax"]),
        )

        c1, c2 = st.columns(2)

        c1.metric(
            "Total Deductions",
            money(result["total_deductions"]),
        )

        c2.metric(
            "NET SALARY",
            money(result["net_salary"]),
        )

        tds = result.get("tds_breakdown") or {}

        if tds:
            st.subheader("Tax projection")

            c1, c2, c3 = st.columns(3)

            c1.metric(
                "Projected Salary",
                money(tds.get("projected_salary")),
            )

            c2.metric(
                "Estimated Taxable Income",
                money(tds.get("estimated_total_income")),
            )

            c3.metric(
                "Annual Tax Liability",
                money(tds.get("annual_tax_liability")),
            )

        with st.expander("Full calculation trace"):
            import json

            trace = json.loads(
                json.dumps(result, default=str)
            )

            st.json(
                trace,
                expanded=False,
            )

    except Exception as exc:
        st.error(
            f"Calculation could not be completed: {exc}"
        )
