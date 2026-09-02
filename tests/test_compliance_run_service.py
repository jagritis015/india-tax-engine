import pandas as pd
import pytest

from tax_engine.services.compliance_run_service import (
    process_company_compliance_file,
)


CSV_DATA = """employee_id,employee_name,pan,sex,date_of_joining,work_state,tax_regime,regime_declared,basic_salary,dearness_allowance,hra,special_allowance,bonus,commission,other_taxable_earnings,taxable_salary_ytd,tds_deducted_ytd,previous_employer_taxable_salary,previous_employer_tds,previous_employer_details_verified,other_income_declared,other_income_declared_by_employee,pf_applicable,pf_wages,prior_epf_member,payroll_month,tax_year
EMP001,Arjun Sharma,ABCDE1234F,male,2026-04-01,Karnataka,new,true,100000,0,40000,60000,0,0,0,800000,0,0,0,false,0,false,true,15000,true,8,2026-27
EMP002,Priya Mehta,BCDEF2345G,female,2026-04-01,Maharashtra,new,true,150000,0,60000,90000,25000,0,0,1200000,100000,0,0,false,0,false,true,15000,true,8,2026-27
EMP003,Rahul Verma,CDEFG3456H,male,2026-04-01,Delhi,old,true,80000,0,32000,48000,0,0,0,640000,50000,0,0,false,0,false,true,15000,true,8,2026-27
EMP004,Ananya Rao,DEFGH4567J,female,2026-04-01,Tamil Nadu,new,true,200000,0,80000,120000,50000,0,0,1600000,150000,0,0,false,0,false,true,15000,true,8,2026-27
EMP005,Broken Employee,EFGHI5678K,male,2026-04-01,Karnataka,INVALID,true,100000,0,40000,60000,0,0,0,800000,0,0,0,false,0,false,true,15000,true,8,2026-27
"""


@pytest.fixture
def mixed_payroll_dataframe(tmp_path):
    fixture_path = tmp_path / "multi_employee_test.csv"
    fixture_path.write_text(CSV_DATA)
    return pd.read_csv(fixture_path)


def test_mixed_file_quarantines_bad_employee_and_continues(
    mixed_payroll_dataframe,
):
    df = mixed_payroll_dataframe

    result = process_company_compliance_file(df)

    assert result.uploaded_records == 5
    assert result.valid_records == 4
    assert result.quarantined_records == 1

    assert result.monthly_compliance is not None

    assert len(result.quarantine) == 1
    assert result.quarantine[0].employee_id == "EMP005"

    assert "Invalid tax regime" in result.quarantine[0].error


def test_quarantine_prevents_company_approval(
    mixed_payroll_dataframe,
):
    df = mixed_payroll_dataframe

    result = process_company_compliance_file(df)

    assert result.company_run_complete is False
    assert result.payroll_can_be_approved is False


def test_valid_rows_still_receive_compliance_processing(
    mixed_payroll_dataframe,
):
    df = mixed_payroll_dataframe

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
