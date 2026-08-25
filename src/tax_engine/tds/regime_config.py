from tax_engine.payroll.employee import TaxRegime
from tax_engine.tds.regimes import (
    new_regime_2026_27,
    old_regime_2026_27,
)


def get_regime_config(tax_year: str, regime: TaxRegime):
    if tax_year != "2026-27":
        raise ValueError(f"Unsupported tax year: {tax_year}")

    if regime == TaxRegime.NEW:
        return new_regime_2026_27

    if regime == TaxRegime.OLD:
        return old_regime_2026_27

    raise ValueError(f"Unsupported tax regime: {regime}")
