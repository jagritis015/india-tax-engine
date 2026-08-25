from decimal import Decimal

import pytest
from pydantic import ValidationError

from tax_engine.models.transaction import Transaction, ResidencyStatus


def test_valid_transaction_is_accepted():
    tx = Transaction(
        transaction_id="TXN-001",
        vendor_id="VENDOR-001",
        vendor_name="ABC Consultants Pvt Ltd",
        amount=Decimal("100000"),
        nature_of_payment="professional_services",
        residency_status=ResidencyStatus.RESIDENT,
        pan_available=True,
        pan="ABCDE1234F",
    )

    assert tx.amount == Decimal("100000")
    assert tx.residency_status == ResidencyStatus.RESIDENT


def test_negative_amount_is_rejected():
    with pytest.raises(ValidationError):
        Transaction(
            transaction_id="TXN-002",
            vendor_id="VENDOR-002",
            vendor_name="Bad Test Vendor",
            amount=Decimal("-5000"),
            nature_of_payment="professional_services",
            residency_status=ResidencyStatus.RESIDENT,
            pan_available=True,
        )
