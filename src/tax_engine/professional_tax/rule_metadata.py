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

    ("tamil_nadu", "2026-27"): PTRuleMetadata(
        state="tamil_nadu",
        tax_year="2026-27",
        status="verified",
        legislation=(
            "Tamil Nadu Urban Local Bodies Rules, 2023 - "
            "Tax on Profession, Trade, Calling and Employment"
        ),
        source_authority=(
            "Directorate of Town Panchayats, Government of Tamil Nadu"
        ),
        effective_from="2026-04-01",
        notes=(
            "Employee professional tax assessed half-yearly; "
            "requires applicable half-year payroll context"
        ),
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
