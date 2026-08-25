from tax_engine.professional_tax.coverage import (
    get_pt_coverage,
)
from tax_engine.professional_tax.rule_metadata import (
    get_pt_rule_metadata,
)


def test_verified_pt_states_are_reported():
    coverage = get_pt_coverage("2026-27")

    assert "karnataka" in coverage["verified_states"]
    assert "maharashtra" in coverage["verified_states"]
    assert "telangana" in coverage["verified_states"]
    assert "gujarat" in coverage["verified_states"]


def test_unverified_state_is_visible():
    coverage = get_pt_coverage("2026-27")

    assert "tamil_nadu" in coverage["not_verified_states"]


def test_karnataka_has_rule_metadata():
    metadata = get_pt_rule_metadata(
        "karnataka",
        "2026-27",
    )

    assert metadata is not None
    assert metadata.status == "verified"


def test_unknown_tax_year_has_no_verified_rules():
    coverage = get_pt_coverage("2099-00")

    assert coverage["verified_state_count"] == 0
