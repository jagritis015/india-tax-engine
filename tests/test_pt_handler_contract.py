import inspect

from tax_engine.professional_tax.bootstrap import (
    register_professional_tax_rules,
)
from tax_engine.professional_tax import registry


REQUIRED_HANDLER_ARGUMENTS = {
    "monthly_salary_or_wages",
    "payroll_month",
    "tax_year",
    "sex",
    "pt_half_year_salary_or_wages",
    "pt_days_employed_in_half_year",
    "pt_already_deducted_for_half_year",
}


def test_every_registered_pt_handler_implements_common_contract():
    register_professional_tax_rules()

    assert registry._PT_HANDLERS

    for key, handler in registry._PT_HANDLERS.items():
        signature = inspect.signature(handler)
        parameters = set(signature.parameters)

        missing = REQUIRED_HANDLER_ARGUMENTS - parameters

        assert not missing, (
            f"{key} PT handler violates common interface. "
            f"Missing: {sorted(missing)}"
        )


def test_nagaland_is_registered():
    register_professional_tax_rules()

    assert (
        "nagaland",
        "2026-27",
    ) in registry._PT_HANDLERS
