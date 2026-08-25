from collections.abc import Callable


PTCalculator = Callable[..., object]

_PT_HANDLERS: dict[tuple[str, str], PTCalculator] = {}

_PT_NOT_APPLICABLE: set[tuple[str, str]] = set()


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
