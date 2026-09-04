from datetime import date

import pandas as pd
import streamlit as st

from tax_engine.statutory.law import income_tax_law_context
from tax_engine.statutory.rule_registry import TY_2026_27_RULES


st.set_page_config(
    page_title="Statutory Context | India Payroll Engine",
    page_icon="⚖️",
    layout="wide",
)

st.title("Statutory Context")
st.caption(
    "See which Income-tax Act governs a payroll period and which statutory rules "
    "are currently verified in the engine."
)

st.info(
    "The law context is resolved by the deterministic engine. Periods beginning "
    "before 1 April 2026 use the Income-tax Act, 1961. Periods beginning on or "
    "after 1 April 2026 use the Income-tax Act, 2025 and Tax Year terminology."
)

period_date = st.date_input(
    "Payroll period date",
    value=date(2026, 8, 1),
    help="Choose any date in the payroll period to inspect its governing law context.",
)

context = income_tax_law_context(period_date)
act_label = {
    "income_tax_act_1961": "Income-tax Act, 1961",
    "income_tax_act_2025": "Income-tax Act, 2025",
}[context.act.value]

st.subheader("Resolved governing law")
c1, c2, c3, c4 = st.columns(4)
c1.metric("Governing Act", act_label)
c2.metric("Statutory period", context.period_label)
c3.metric("Period starts", context.period_start.strftime("%d %b %Y"))
c4.metric("Period ends", context.period_end.strftime("%d %b %Y"))

if context.assessment_year is None:
    st.success(
        f"Tax Year {context.tax_year} • Income-tax Act, 2025 • "
        "Assessment Year is not used for this statutory context."
    )
else:
    st.warning(
        f"Income-tax Act, 1961 context • period {context.period_label} • "
        f"Assessment Year {context.assessment_year}. Historical 1961-Act calculation "
        "coverage must be separately verified before execution."
    )

st.divider()
st.subheader("TY 2026-27 statutory rule coverage")
st.caption(
    "This table exposes the statutory registry used to govern executable income-tax "
    "logic. A VERIFIED label means the registered rule has authoritative provenance; "
    "it does not imply every possible payroll scenario is supported."
)

rows = []
for rule in TY_2026_27_RULES.values():
    rows.append(
        {
            "Rule": rule.rule_id,
            "Tax Year": rule.tax_year,
            "Legislation": rule.legislation,
            "Provision": rule.provision,
            "Status": rule.status.value.upper(),
            "Scope": rule.description,
            "Source / evidence": rule.source_reference,
        }
    )

rules_df = pd.DataFrame(rows)
verified_count = int((rules_df["Status"] == "VERIFIED").sum())
review_count = int((rules_df["Status"] == "REVIEW_REQUIRED").sum())
not_implemented_count = int((rules_df["Status"] == "NOT_IMPLEMENTED").sum())

m1, m2, m3, m4 = st.columns(4)
m1.metric("Registered rules", len(rules_df))
m2.metric("Verified", verified_count)
m3.metric("Review required", review_count)
m4.metric("Not implemented", not_implemented_count)

st.dataframe(
    rules_df,
    use_container_width=True,
    hide_index=True,
)

st.divider()
st.subheader("Execution safety model")
st.markdown(
    """
1. Resolve the statutory period and governing Income-tax Act.
2. Resolve the rule required for the calculation and Tax Year.
3. Require verified statutory provenance before protected calculations execute.
4. Fail closed for unsupported or unresolved statutory cases instead of inventing an amount.
"""
)

st.caption(
    "Current UAT focus: TY 2026-27. The 1961/2025 transition resolver is implemented, "
    "while historical 1961-Act calculation coverage is not represented here as complete."
)
