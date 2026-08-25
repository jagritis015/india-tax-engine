from tax_engine.professional_tax.rule_metadata import (
    PT_RULE_METADATA,
)
from tax_engine.professional_tax.state_registry import (
    STATE_ALIASES,
)


def get_pt_coverage(
    tax_year: str,
) -> dict:
    all_states = sorted(set(STATE_ALIASES.values()))

    verified = sorted(
        state
        for (state, year), metadata
        in PT_RULE_METADATA.items()
        if year == tax_year
        and metadata.status == "verified"
    )

    not_verified = sorted(
        state
        for state in all_states
        if state not in verified
    )

    return {
        "tax_year": tax_year,
        "verified_states": verified,
        "verified_state_count": len(verified),
        "not_verified_states": not_verified,
        "not_verified_state_count": len(not_verified),
    }
