from tax_engine.professional_tax.states import jharkhand_2026_27
from tax_engine.professional_tax.states import bihar_2026_27
from tax_engine.professional_tax.states import assam_2026_27
from tax_engine.professional_tax.states import nagaland_2026_27
from tax_engine.professional_tax.registry import register_pt_handler
from tax_engine.professional_tax.states import (
    gujarat_2026_27,
    karnataka_2026_27,
    maharashtra_2026_27,
    telangana_2026_27,
    tamil_nadu_2026_27,
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
        "nagaland",
        "2026-27",
        nagaland_2026_27.calculate,
    )

    register_pt_handler(
        "assam",
        "2026-27",
        assam_2026_27.calculate,
    )

    register_pt_handler(
        "jharkhand",
        "2026-27",
        jharkhand_2026_27.calculate,
    )

    register_pt_handler(
        "bihar",
        "2026-27",
        bihar_2026_27.calculate,
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


    register_pt_handler(
        "tamil_nadu",
        "2026-27",
        tamil_nadu_2026_27.calculate,
    )
