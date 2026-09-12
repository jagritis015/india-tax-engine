# India ↔ United States: first global mobility corridor

## Product decision
India ↔ United States is the first cross-border corridor for the Mobility OS.

This corridor must work in both directions:
- India employee assigned or transferred to the United States
- United States employee assigned or transferred to India

The first executable UAT persona is **Aditi Joshi (NVL-017), Bengaluru → United States**. The initial host state is configurable and must never be silently assumed because U.S. state tax and payroll treatment can materially differ.

## Core operating object
`Person → Employment → Assignment → Location Timeline → Compensation Ledger → Home Payroll → Host Payroll → Tax Positions → Immigration Case → Mobility Policy → Compliance Tasks → Audit Events`

## First case lifecycle
1. **Initiate**: business sponsor, home/host entities, proposed dates, assignment type, family/dependants, host work state/city, compensation and policy.
2. **Assess**: data completeness, immigration workstream, India tax residency, U.S. federal tax residency, U.S. state tax scope, payroll/shadow payroll, social security, treaty/FTC review, tax equalization applicability, assignment cost.
3. **Approve**: business, finance, mobility and required specialist approvals. No production payroll or immigration change before approval.
4. **Execute**: create approved payroll instructions, immigration tasks, document requests, relocation tasks and employee communications.
5. **Operate**: track physical presence, compensation changes, tax/payroll events, immigration expiries, assignment cost and exceptions.
6. **Year-end / reconcile**: actual home/host taxes, hypothetical tax, foreign tax credits where supported, tax equalization settlement and audit package.
7. **Repatriate / transfer**: close assignment, restore or change payroll profiles, final compliance tasks and retain history.

## UAT case: Aditi Joshi
Synthetic facts to seed only after the employee/payroll master is live:
- Person: Aditi Joshi / NVL-017
- Home: Bengaluru, Karnataka, India
- Host: United States (state must be selected in the case)
- Assignment type: long-term assignment
- Duration: 24 months
- Home employment relationship: retained for UAT scenario
- Mobility policy: tax equalization
- Home payroll: assess continuation
- U.S. host/shadow payroll: assess
- Family: spouse + child for workflow testing
- Compensation: existing India payroll compensation plus configurable assignment allowances
- Immigration: case required; exact visa category is not inferred by AI

## Tax architecture
### India
Use the existing deterministic India engine for supported calculations. Extend residency and cross-border sourcing only after authoritative rules are separately verified and versioned.

### United States
Build as independent deterministic layers:
1. federal tax residency
2. federal income tax
3. payroll taxes / social security and Medicare
4. state residency and state income tax
5. local tax where applicable
6. treaty / foreign tax credit position

Do not build a single `US tax` number that hides these layers.

### U.S. federal residency fact engine
The first verified U.S. mobility rule should be the Substantial Presence Test. It requires a day ledger and must preserve excluded-day categories rather than merely counting calendar days. The engine returns facts and a preliminary tax-residency result with evidence, not immigration status.

### India–U.S. treaty
Maintain treaty analysis as a separate position object. Treaty residency, employment income, relief from double taxation and foreign tax credit treatment must be versioned and evidence-backed. State tax treatment is separate; never assume a U.S. state follows the federal treaty.

### Social security
Do not assume an India–U.S. totalization agreement exists. The current U.S. Social Security Administration status list does not list India among agreements in force. The product should therefore raise a social-security review rather than fabricate a certificate-of-coverage path.

## Hypothetical tax
Hypothetical tax is a **mobility-policy calculation**, not actual statutory withholding.

Inputs:
- home-country stay-at-home compensation defined by company policy
- policy-included income
- policy deductions/exclusions
- family/filer assumptions where policy permits
- hypothetical social contributions where policy requires
- tax year and verified India tax rules

Outputs:
- hypothetical taxable income
- hypothetical India income tax
- policy adjustments
- hypothetical tax withheld from employee
- full calculation trace and policy version

The first India→U.S. vertical slice should calculate **India stay-at-home hypothetical tax using the verified India engine**. It must not calculate U.S. actual tax until the relevant U.S. federal/state engines are verified.

## Tax equalization ledger
Track separately:
- hypothetical employee tax
- actual India tax
- actual U.S. federal tax
- actual U.S. state/local tax
- foreign tax credits / treaty relief where verified
- company-paid taxes
- employee-paid taxes
- tax advances
- tax reimbursements
- final employee/company settlement

Every value requires source, jurisdiction, tax year, currency, FX basis, calculation version and status (`estimated`, `withheld`, `paid`, `filed`, `final`).

## Immigration workflow
Immigration is connected to the assignment but is not allowed to invent legal eligibility.

AI may:
- collect role, entity, assignment, education and family facts
- classify documents
- identify missing documents
- maintain expiry dates and tasks
- generate a structured specialist handoff
- explain case status

AI may not:
- guarantee visa eligibility or approval
- select a visa category when facts require legal judgment
- represent that a filing has occurred without a verified action/evidence

## Guardian alerts for this corridor
Initial alerts:
- host state missing
- assignment start date precedes verified work authorization
- U.S. day ledger incomplete
- potential U.S. substantial-presence threshold approaching
- India residency assessment missing
- host compensation missing from payroll assessment
- shadow payroll decision outstanding
- hypothetical-tax policy missing
- actual-vs-hypothetical tax variance outside threshold
- immigration document expiry approaching
- treaty/FTC position awaiting evidence
- social-security position unresolved

## Employee experience
Aditi should see one timeline with:
- move status
- immigration tasks
- documents
- payroll setup
- compensation and allowances
- hypothetical tax explanation
- tax-equalization position
- relocation tasks
- upcoming deadlines
- Ask Mobility assistant grounded only in her case, company policy and verified rule sources

## In-house mobility command center
Show:
- India↔U.S. active assignments
- assignments starting in 30/60/90 days
- immigration actions due
- tax-residency/day-count risks
- payroll/shadow-payroll actions
- unresolved tax positions
- assignment forecast vs actual cost
- tax equalization exposure
- cases awaiting specialist review

## Fail-closed rules
- Unknown U.S. host state → no state-tax calculation.
- Unverified U.S. tax engine → no U.S. monetary tax output.
- Missing day evidence → residency assessment remains review-required.
- Ambiguous treaty position → specialist review.
- Immigration eligibility uncertainty → specialist review.
- Unsupported India cross-border rule → review-required.
- No exception clears merely because a user viewed or acknowledged it.

## First functional build after payroll master deployment
1. Mobility data types and synthetic Aditi India→U.S. assignment.
2. `/uat/mobility` command center.
3. `/uat/mobility/aditi-india-us` case workspace.
4. Editable host state, assignment dates, family, policy and compensation facts.
5. Workday/day-count ledger.
6. Deterministic U.S. Substantial Presence Test fact engine.
7. India hypothetical-tax calculation using the existing verified India calculation path.
8. Guardian findings generated from structured facts.
9. U.S. actual tax remains explicitly `REVIEW_REQUIRED / ENGINE_NOT_VERIFIED` until implemented and tested.

## Definition of done
This corridor is not complete until a user can initiate the Aditi case, edit facts, see rule-driven risks, calculate supported India hypothetical tax, see unsupported U.S. monetary calculations fail closed, review immigration/payroll tasks, and trace every decision/calculation to its source and version on the canonical UAT Site.