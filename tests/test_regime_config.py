from decimal import Decimal

from tax_engine.payroll.employee import TaxRegime
from tax_engine.tds.regime_config import get_regime_config


def test_new_regime_config():
    config = get_regime_config("2026-27", TaxRegime.NEW)

    assert config.REGIME == "new"
    assert config.STANDARD_DEDUCTION == Decimal("75000")


def test_old_regime_config():
    config = get_regime_config("2026-27", TaxRegime.OLD)

    assert config.REGIME == "old"
    assert config.STANDARD_DEDUCTION == Decimal("50000")
