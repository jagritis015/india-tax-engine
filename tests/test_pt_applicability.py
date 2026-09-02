from tax_engine.professional_tax.applicability import (
    PTApplicability,
    PT_APPLICABILITY_RULES,
    get_pt_applicability,
)


def test_all_36_indian_jurisdictions_are_classified():
    rules = [
        rule
        for (state, year), rule
        in PT_APPLICABILITY_RULES.items()
        if year == "2026-27"
    ]

    assert len(rules) == 36


def test_19_jurisdictions_have_pt():
    applicable = [
        rule
        for rule in PT_APPLICABILITY_RULES.values()
        if rule.tax_year == "2026-27"
        and rule.applicability
        == PTApplicability.APPLICABLE
    ]

    assert len(applicable) == 19


def test_17_jurisdictions_do_not_have_pt():
    not_applicable = [
        rule
        for rule in PT_APPLICABILITY_RULES.values()
        if rule.tax_year == "2026-27"
        and rule.applicability
        == PTApplicability.NOT_APPLICABLE
    ]

    assert len(not_applicable) == 17


def test_delhi_is_locked_not_applicable():
    rule = get_pt_applicability(
        state="delhi",
        tax_year="2026-27",
    )

    assert rule is not None
    assert (
        rule.applicability
        == PTApplicability.NOT_APPLICABLE
    )


def test_tamil_nadu_is_pt_applicable():
    rule = get_pt_applicability(
        state="tamil_nadu",
        tax_year="2026-27",
    )

    assert rule is not None
    assert (
        rule.applicability
        == PTApplicability.APPLICABLE
    )


def test_odisha_is_not_applicable_from_2026_27():
    rule = get_pt_applicability(
        state="odisha",
        tax_year="2026-27",
    )

    assert rule is not None
    assert (
        rule.applicability
        == PTApplicability.NOT_APPLICABLE
    )
    assert rule.effective_from == "2026-04-01"


def test_punjab_psdt_is_not_misclassified_as_pt():
    rule = get_pt_applicability(
        state="punjab",
        tax_year="2026-27",
    )

    assert rule is not None
    assert (
        rule.applicability
        == PTApplicability.NOT_APPLICABLE
    )
    assert "Development Tax" in rule.notes
