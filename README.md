# India Payroll OS

An AI-native India payroll, tax, and compliance operating system. Statutory
calculations remain deterministic, versioned, explainable, and auditable.

This repository is the product's source of truth:

- `src/tax_engine/` contains the Python calculation and authorization platform.
- `tests/` contains deterministic statutory and payroll regression tests.
- `web/` contains the customer-facing payroll workspace deployed for daily UAT.
- `app.py` and `pages/` contain the legacy Streamlit engineering interface.

## Daily product preview

The current interactive preview is available at
https://india-payroll-os.abhisheksingh-5oct.chatgpt.site. It uses representative
data only. Until authenticated persistence and the payroll API are connected,
it must not be used for identifiable employee or payroll information.

## Local validation

Run the engine tests from the repository root:

```bash
python -m pytest -q
```

Run the web workspace checks from `web/`:

```bash
npm ci
npm test
```

All product changes should be made here first. The hosted Sites repository is a
deployment mirror, not an independent source of product code.
