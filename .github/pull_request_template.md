## Summary
Describe the change and the user or operational problem it solves.

## Statutory safety
- [ ] No statutory monetary amount is produced by an LLM or heuristic path.
- [ ] Decimal-based calculation behavior is preserved where money is involved.
- [ ] Unsupported or uncertain statutory cases fail safely to review.
- [ ] Rule provenance/effective-period behavior is preserved or explicitly updated.

## Validation
- [ ] `python -m pytest -q` passes locally or in CI.
- [ ] New/changed behavior has focused tests.
- [ ] Golden/integration tests were updated if the payroll contract changed.

## Security and access
- [ ] Authorization boundaries were considered.
- [ ] No cross-tenant or employee-data exposure is introduced.
- [ ] Secrets or sensitive payroll data are not committed.

## Release impact
State migration, deployment, rollback, compliance, or customer-impact considerations.
