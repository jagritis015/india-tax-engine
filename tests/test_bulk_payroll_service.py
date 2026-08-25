from io import StringIO

import pandas as pd

from tax_engine.services.bulk_payroll_service import (
    run_bulk_payroll,
)


CSV_DATA = """employee_id,employee_name,pan,sex,date_of_joining,work_state,tax_regime,regime_declared,basic_salary,dearness_allowance,hra,special_allowance,bonus,commission,other_taxable_earnings,taxable_salary_ytd,tds_deducted_ytd,previous_employer_taxable_salary,previous_employer_tds,previous_employer_details_verified,other_income_declared,other_income_declared_by_employee,pf_applicable,pf_wages,prior_epf_member,payroll_month,tax_year
EMP001,Test Employee,ABCDE1234F,male,2026-04-01,Karnataka,new,true,100000,0,40000,60000,0,0,0,800000,0,0,0,false,0,false,true,15000,true,8,2026-27
"""


def test_bulk_payroll_processes_employee():
    df = pd.read_csv(
        StringIO(CSV_DATA)
    )

    result = run_bulk_payroll(df)

    assert len(result) == 1
    assert result.iloc[0]["status"] == "CALCULATED"
    assert result.iloc[0]["net_salary"] == 161437


def test_bulk_tamil_nadu_employee_calculates_with_half_year_context():
    csv_data = """employee_id,employee_name,pan,sex,date_of_joining,work_state,tax_regime,regime_declared,basic_salary,dearness_allowance,hra,special_allowance,bonus,commission,other_taxable_earnings,taxable_salary_ytd,tds_deducted_ytd,previous_employer_taxable_salary,previous_employer_tds,previous_employer_details_verified,other_income_declared,other_income_declared_by_employee,pf_applicable,pf_wages,prior_epf_member,pt_half_year_salary_or_wages,pt_days_employed_in_half_year,pt_already_deducted_for_half_year,payroll_month,tax_year
TN001,Tamil Nadu Employee,BCDEF2345G,female,2026-04-01,Tamil Nadu,new,true,200000,0,80000,120000,0,0,0,1600000,150000,0,0,false,0,false,true,15000,true,2400000,150,0,8,2026-27
"""

    df = pd.read_csv(
        StringIO(csv_data)
    )

    result = run_bulk_payroll(df)

    assert len(result) == 1
    assert result.iloc[0]["status"] == "CALCULATED"
    assert result.iloc[0]["professional_tax"] == 1250
    assert result.iloc[0]["net_salary"] is not None
