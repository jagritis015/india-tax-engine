from tax_engine.professional_tax.registry import (
    is_pt_not_applicable,
)


NOT_APPLICABLE_2026_27 = [
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
]


def test_all_17_locked_non_pt_jurisdictions():
    for state in NOT_APPLICABLE_2026_27:
        assert is_pt_not_applicable(
            state=state,
            tax_year="2026-27",
        )


def test_exactly_17_non_pt_jurisdictions_are_locked():
    assert len(NOT_APPLICABLE_2026_27) == 17


def test_delhi_remains_locked():
    assert is_pt_not_applicable(
        state="delhi",
        tax_year="2026-27",
    )


def test_karnataka_is_not_misclassified():
    assert not is_pt_not_applicable(
        state="karnataka",
        tax_year="2026-27",
    )


def test_tamil_nadu_is_not_misclassified():
    assert not is_pt_not_applicable(
        state="tamil_nadu",
        tax_year="2026-27",
    )
