# Copilot instructions for `india-tax-engine`

## Repository commands

Install the runtime dependency with:

```bash
python -m pip install -r requirements.txt
```

Run the complete test suite:

```bash
python -m pytest
```

Run one test file or one test function:

```bash
python -m pytest tests/test_pt_engine.py -q
python -m pytest tests/test_golden_payroll.py::test_golden_new_regime_karnataka_employee -q
```

Run the Streamlit interface locally:

```bash
streamlit run app.py
```

There is no repository-configured build or lint command. Do not introduce a new formatter, linter, or build system just for a change.

## Architecture

- `app.py` is the Streamlit UI. It supports single-employee, bulk CSV, and company compliance workflows; it should call services rather than calculation internals.
- `tax_engine.payroll.employee.EmployeePayrollInput` is the Pydantic input contract. `tax_engine.payroll.payroll_engine.calculate_monthly_payroll` is the main orchestration layer and returns the canonical `PayrollResult` shape.
- `tax_engine.services.payroll_service.run_employee_payroll` is the stable application-facing entry point for one employee. `bulk_payroll_service` converts CSV rows to validated inputs and runs that same service for every row.
- The payroll engine combines three statutory pipelines:
  - TDS: salary projection across the April–March tax year, taxable-salary deductions/HRA handling, annual slab/rebate/surcharge/cess calculation, then current-month allocation after prior credits.
  - PF: applicability and higher-wage eligibility are resolved separately from contribution arithmetic; the PF calculator applies the ceiling/rate rules.
  - Professional Tax: state names are normalized, handlers are loaded through the registry/bootstrap, and state-specific or declarative rules return a `ProfessionalTaxResult`.
- `tax_engine.ai` is an engine-grounded boundary, not a second calculator. Tools and compliance/dashboard layers consume deterministic payroll outputs, aggregate them, and expose explanations, issues, and approval readiness. AI-facing schemas explicitly identify `DETERMINISTIC_ENGINE` as the source and disallow AI-calculated amounts.
- Professional Tax has both executable state handlers and data/declarative applicability. When a jurisdiction or tax year is not verified, the result must remain `REVIEW_REQUIRED` (or `NOT_APPLICABLE` only when the applicability registry says so).

## Codebase-specific conventions

- Use `Decimal` for every monetary value and preserve exact `Decimal` values in outputs and assertions. Do not introduce float arithmetic.
- Treat `2026-27` as the active tax-year rule set. Calendar payroll months are interpreted in tax-year order April through March; use existing projection helpers instead of duplicating month arithmetic.
- Preserve the status model: a missing, unverified, unsupported, or ambiguous statutory input propagates `REVIEW_REQUIRED`; do not guess a tax treatment. `PayrollResult` intentionally leaves final deductions/net salary unset when a required component needs review.
- Keep validation at the Pydantic input boundary (`Field` constraints and enum types) and keep statutory arithmetic in focused modules. Reuse existing resolvers and helpers rather than reimplementing normalization, projection, rounding, or eligibility logic.
- Preserve explainability: calculation results include component breakdowns and rule references. New statutory rules should return the existing result models and identify their legislation/source where the model supports it.
- For Professional Tax changes, normalize state aliases through `state_registry`, register supported handlers in `professional_tax/bootstrap.py`, and update the applicable metadata/data and boundary tests. The registry is lazily initialized by `pt_engine`; do not bypass it with UI-specific imports.
- Keep AI/compliance code read-only with respect to statutory amounts. It may classify statuses, aggregate results, and produce issue/action metadata, but all amounts must come from `run_employee_payroll`.
- CSV ingestion uses explicit converters for `Decimal`, booleans, enums, dates, and optional values. Invalid rows are quarantined or marked blocked with an error; they must not be silently dropped.
- Tests are organized by domain (`tests/test_tds_*.py`, `test_pf_*.py`, `test_pt_*.py`, service/AI tests) and use boundary cases, `pytest.raises` for invalid inputs, and golden end-to-end payroll assertions. Update the narrowest relevant test module when changing a rule, plus a payroll integration/golden test when the final payroll contract changes.
