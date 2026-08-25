from decimal import Decimal

import pytest

from tax_engine.pf.pf_calculator import calculate_employee_pf


def test_pf_at_statutory_ceiling():
    result = calculate_employee_pf(
        pf_wages=Decimal("50000"),
    )

    assert result["contribution_base"] == Decimal("15000")
    assert result["employee_pf"] == Decimal("1800")


def test_pf_below_statutory_ceiling():
    result = calculate_employee_pf(
        pf_wages=Decimal("10000"),
    )

    assert result["contribution_base"] == Decimal("10000")
    assert result["employee_pf"] == Decimal("1200")


def test_pf_not_applicable():
    result = calculate_employee_pf(
        pf_wages=Decimal("50000"),
        pf_applicable=False,
    )

    assert result["contribution_base"] == Decimal("0")
    assert result["employee_pf"] == Decimal("0")


def test_pf_on_higher_wages():
    result = calculate_employee_pf(
        pf_wages=Decimal("50000"),
        contribute_on_higher_wages=True,
    )

    assert result["contribution_base"] == Decimal("50000")
    assert result["employee_pf"] == Decimal("6000")


def test_international_worker_has_no_15000_ceiling():
    result = calculate_employee_pf(
        pf_wages=Decimal("50000"),
        international_worker=True,
    )

    assert result["contribution_base"] == Decimal("50000")
    assert result["employee_pf"] == Decimal("6000")


def test_reduced_10_percent_rate():
    result = calculate_employee_pf(
        pf_wages=Decimal("15000"),
        contribution_rate=Decimal("0.10"),
    )

    assert result["employee_pf"] == Decimal("1500")


def test_negative_pf_wages_rejected():
    with pytest.raises(ValueError):
        calculate_employee_pf(
            pf_wages=Decimal("-1"),
        )


def test_invalid_pf_rate_rejected():
    with pytest.raises(ValueError):
        calculate_employee_pf(
            pf_wages=Decimal("15000"),
            contribution_rate=Decimal("0.15"),
        )
