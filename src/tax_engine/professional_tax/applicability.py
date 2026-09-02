from dataclasses import dataclass
from enum import Enum


class PTApplicability(str, Enum):
    APPLICABLE = "APPLICABLE"
    NOT_APPLICABLE = "NOT_APPLICABLE"


@dataclass(frozen=True)
class PTApplicabilityRule:
    state: str
    tax_year: str
    applicability: PTApplicability
    effective_from: str
    notes: str = ""


# Locked Professional Tax applicability matrix for TY 2026-27.
#
# IMPORTANT:
# APPLICABLE means the jurisdiction levies employee Professional Tax.
# It does NOT mean that the calculation schedule has been implemented.
#
# NOT_APPLICABLE means employee PT must deterministically return ₹0
# and must never become REVIEW_REQUIRED solely because no calculator
# exists.
PT_APPLICABILITY_RULES: dict[
    tuple[str, str],
    PTApplicabilityRule,
] = {}


def _register(
    state: str,
    applicability: PTApplicability,
    *,
    effective_from: str = "2026-04-01",
    notes: str = "",
) -> None:
    rule = PTApplicabilityRule(
        state=state,
        tax_year="2026-27",
        applicability=applicability,
        effective_from=effective_from,
        notes=notes,
    )

    PT_APPLICABILITY_RULES[
        (state, "2026-27")
    ] = rule


# ---------------------------------------------------------
# PT APPLICABLE
# ---------------------------------------------------------

for _state in [
    "andhra_pradesh",
    "assam",
    "bihar",
    "gujarat",
    "jharkhand",
    "karnataka",
    "kerala",
    "madhya_pradesh",
    "maharashtra",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "puducherry",
    "sikkim",
    "tamil_nadu",
    "telangana",
    "tripura",
    "west_bengal",
]:
    _register(
        _state,
        PTApplicability.APPLICABLE,
    )


# ---------------------------------------------------------
# PT NOT APPLICABLE
# ---------------------------------------------------------

for _state in [
    "andaman_and_nicobar_islands",
    "arunachal_pradesh",
    "chandigarh",
    "chhattisgarh",
    "dadra_and_nagar_haveli_and_daman_and_diu",
    "delhi",
    "goa",
    "haryana",
    "himachal_pradesh",
    "jammu_and_kashmir",
    "ladakh",
    "lakshadweep",
    "odisha",
    "punjab",
    "rajasthan",
    "uttar_pradesh",
    "uttarakhand",
]:
    _register(
        _state,
        PTApplicability.NOT_APPLICABLE,
    )


# Important effective-period notes.
PT_APPLICABILITY_RULES[
    ("odisha", "2026-27")
] = PTApplicabilityRule(
    state="odisha",
    tax_year="2026-27",
    applicability=PTApplicability.NOT_APPLICABLE,
    effective_from="2026-04-01",
    notes=(
        "Professional Tax repealed from 1 April 2026. "
        "Historical periods require historical Odisha PT rules."
    ),
)

PT_APPLICABILITY_RULES[
    ("punjab", "2026-27")
] = PTApplicabilityRule(
    state="punjab",
    tax_year="2026-27",
    applicability=PTApplicability.NOT_APPLICABLE,
    effective_from="2026-04-01",
    notes=(
        "Ordinary Professional Tax not used. "
        "Punjab State Development Tax must be modeled separately."
    ),
)


def get_pt_applicability(
    *,
    state: str,
    tax_year: str,
) -> PTApplicabilityRule | None:
    return PT_APPLICABILITY_RULES.get(
        (state, tax_year)
    )
