from dataclasses import dataclass


@dataclass(frozen=True)
class PTRuleMetadata:
    state: str
    tax_year: str
    status: str
    legislation: str
    source_authority: str
    effective_from: str
    notes: str = ""


PT_RULE_METADATA = {
    ("karnataka", "2026-27"): PTRuleMetadata(
        state="karnataka",
        tax_year="2026-27",
        status="verified",
        legislation=(
            "Karnataka Tax on Professions, Trades, "
            "Callings and Employments Act"
        ),
        source_authority="Government of Karnataka",
        effective_from="2026-04-01",
        notes="Employee salary/wage PT rule",
    ),

    ("maharashtra", "2026-27"): PTRuleMetadata(
        state="maharashtra",
        tax_year="2026-27",
        status="verified",
        legislation=(
            "Maharashtra State Tax on Professions, Trades, "
            "Callings and Employments Act, 1975"
        ),
        source_authority="Government of Maharashtra",
        effective_from="2026-04-01",
        notes="Employee PT includes sex-specific salary thresholds",
    ),

    ("telangana", "2026-27"): PTRuleMetadata(
        state="telangana",
        tax_year="2026-27",
        status="verified",
        legislation=(
            "Telangana Tax on Professions, Trades, "
            "Callings and Employments Act"
        ),
        source_authority="Government of Telangana",
        effective_from="2026-04-01",
        notes="Employee salary/wage PT slabs",
    ),

    ("gujarat", "2026-27"): PTRuleMetadata(
        state="gujarat",
        tax_year="2026-27",
        status="verified",
        legislation=(
            "Gujarat State Tax on Professions, Trades, "
            "Callings and Employments Act"
        ),
        source_authority="Government of Gujarat",
        effective_from="2026-04-01",
        notes="Employee salary/wage PT rule",
    ),
}


def get_pt_rule_metadata(
    state: str,
    tax_year: str,
) -> PTRuleMetadata | None:
    return PT_RULE_METADATA.get(
        (state, tax_year)
    )
