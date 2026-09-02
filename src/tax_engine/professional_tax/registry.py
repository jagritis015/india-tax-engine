from pathlib import Path
import json
from collections.abc import Callable


PTCalculator = Callable[..., object]

_PT_HANDLERS: dict[tuple[str, str], PTCalculator] = {}

_PT_NOT_APPLICABLE: set[tuple[str, str]] = set()

def _load_locked_not_applicable_from_master_data() -> None:
    """
    Populate the deterministic PT non-applicability registry from the
    canonical TY 2026-27 national PT dataset.

    Once a jurisdiction is locked NOT_APPLICABLE here, absence of a
    calculator must never produce REVIEW_REQUIRED.
    """
    data_path = (
        Path(__file__).parent
        / "data"
        / "pt_rules_2026_27.json"
    )

    payload = json.loads(data_path.read_text())

    tax_year = payload["tax_year"]

    for state, rule in payload["jurisdictions"].items():
        if rule["applicability"] == "NOT_APPLICABLE":
            _PT_NOT_APPLICABLE.add(
                (state, tax_year)
            )


_load_locked_not_applicable_from_master_data()




def register_pt_handler(
    state: str,
    tax_year: str,
    calculator: PTCalculator,
) -> None:
    _PT_HANDLERS[(state, tax_year)] = calculator


def register_pt_not_applicable(
    state: str,
    tax_year: str,
) -> None:
    _PT_NOT_APPLICABLE.add((state, tax_year))


def get_pt_handler(
    state: str,
    tax_year: str,
) -> PTCalculator | None:
    return _PT_HANDLERS.get((state, tax_year))


def is_pt_not_applicable(
    state: str,
    tax_year: str,
) -> bool:
    return (state, tax_year) in _PT_NOT_APPLICABLE
