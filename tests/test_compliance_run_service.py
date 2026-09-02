import pandas as pd

from tax_engine.services.compliance_run_service import (
    process_company_compliance_file,
)


def test_mixed_file_quarantines_bad_employee_and_continues():
    df = pd.read_csv("multi_employee_test.csv")

    result = process_company_compliance_file(df)

    assert result.uploaded_records == 5
    assert result.valid_records == 4
    assert result.quarantined_records == 1

    assert result.monthly_compliance is not None

    assert len(result.quarantine) == 1
    assert result.quarantine[0].employee_id == "EMP005"

    assert "Invalid tax regime" in result.quarantine[0].error


def test_quarantine_prevents_company_approval():
    df = pd.read_csv("multi_employee_test.csv")

    result = process_company_compliance_file(df)

    assert result.company_run_complete is False
    assert result.payroll_can_be_approved is False


def test_valid_rows_still_receive_compliance_processing():
    df = pd.read_csv("multi_employee_test.csv")

    result = process_company_compliance_file(df)

    monthly = result.monthly_compliance

    assert monthly is not None
    assert monthly.employees_processed == 4


def test_all_invalid_rows_do_not_crash():
    df = pd.DataFrame(
        [
            {
                "employee_id": "BAD001",
                "employee_name": "Bad Employee",
                "tax_regime": "INVALID",
            }
        ]
    )

    result = process_company_compliance_file(df)

    assert result.valid_records == 0
    assert result.quarantined_records == 1
    assert result.monthly_compliance is None
    assert result.payroll_can_be_approved is False
