from tax_engine.professional_tax.registry import register_pt_handler
from tax_engine.professional_tax.states import (
    gujarat_2026_27,
    karnataka_2026_27,
    maharashtra_2026_27,
    telangana_2026_27,
)


def register_professional_tax_rules() -> None:
    register_pt_handler(
        "karnataka",
        "2026-27",
        karnataka_2026_27.calculate,
    )

    register_pt_handler(
        "telangana",
        "2026-27",
        telangana_2026_27.calculate,
    )

    register_pt_handler(
        "gujarat",
        "2026-27",
        gujarat_2026_27.calculate,
    )

    register_pt_handler(
        "maharashtra",
        "2026-27",
        maharashtra_2026_27.calculate,
    )
