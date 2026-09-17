"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MOBILITY_CASE_FIXTURES,
  resolveMobilityCase,
  type MobilityCase,
  type ObligationRecord,
} from "@/lib/uat-global-mobility";
import { useMobilitySession } from "../session-store";
import { assignmentTaxMechanism } from "@/lib/uat-tax-equalization";

const tabs = [
  "Overview",
  "Immigration",
  "Days",
  "Compensation",
  "Equity",
  "Tax",
  "Payroll",
  "Readiness",
] as const;
type Tab = (typeof tabs)[number];
export default function MobilityCaseWorkspace() {
  return (
    <Suspense fallback={<main style={shell}><div style={wrap}>Loading mobility case…</div></main>}>
      <MobilityCaseRoute />
    </Suspense>
  );
}

function MobilityCaseRoute() {
  const searchParams = useSearchParams();
  const { cases } = useMobilitySession();
  const caseId = searchParams.get("caseId");
  const caseRecord = resolveMobilityCase(cases, caseId);
  if (!caseRecord)
    return (
      <main style={shell}>
        <div style={wrap}>
          <Link href="/uat/mobility" style={back}>← Mobility case queue</Link>
          <section style={{ ...panel, marginTop: 18 }}>
            <h1 style={h1}>Mobility case not found</h1>
            <p style={muted}>
              The requested case is not present in this UAT session. It may have
              been cleared by a full page reload.
            </p>
          </section>
        </div>
      </main>
    );
  return <MobilityCaseView caseRecord={caseRecord} />;
}

function MobilityCaseView({ caseRecord }: { caseRecord: MobilityCase }) {
  const {
    obligations,
    evaluations,
    taxEqualizationRecords,
    updateCaseAndEvaluate,
    calculateTaxForCase,
    settleTaxForCase,
    resetCase,
  } = useMobilitySession();
  const evaluation = evaluations[caseRecord.caseId];
  const taxRecord = taxEqualizationRecords.find(
    (item) => item.caseId === caseRecord.caseId,
  );
  const taxMechanism = assignmentTaxMechanism(caseRecord.assignmentType);
  const [tab, setTab] = useState<Tab>("Overview");
  const [message, setMessage] = useState("");
  const [newDay, setNewDay] = useState("");
  const [allocation, setAllocation] = useState({
    home: String(caseRecord.compensationHomePct),
    host: String(caseRecord.compensationHostPct),
  });
  const [taxInputs, setTaxInputs] = useState(() => ({
    taxYear: taxRecord?.taxYear ?? "2026-27",
    stayAtHomeBaseSalary: String(taxRecord?.stayAtHomeBaseSalary ?? 0),
    hypotheticalTaxRate: String(taxRecord?.hypotheticalTaxRate ?? 0),
    actualHomeLiability: String(taxRecord?.actualHomeLiability ?? 0),
    actualHostLiability: String(taxRecord?.actualHostLiability ?? 0),
  }));
  const caseObligations = useMemo(
    () => obligations.filter((x) => x.caseId === caseRecord.caseId),
    [obligations, caseRecord.caseId],
  );
  function addDay(e: React.FormEvent) {
    e.preventDefault();
    if (!newDay) return;
    updateCaseAndEvaluate(caseRecord.caseId, {
      currentHostDays: caseRecord.currentHostDays + 1,
      lastUpdated: "Current session",
    });
    setNewDay("");
    setMessage(
      "One host-country day added to this UAT session and full readiness recomputed.",
    );
  }
  function applyAllocation(e: React.FormEvent) {
    e.preventDefault();
    const home = Number(allocation.home),
      host = Number(allocation.host);
    if (
      !Number.isFinite(home) ||
      !Number.isFinite(host) ||
      home < 0 ||
      host < 0
    ) {
      setMessage("Enter valid non-negative percentages.");
      return;
    }
    updateCaseAndEvaluate(caseRecord.caseId, {
      compensationHomePct: home,
      compensationHostPct: host,
      lastUpdated: "Current session",
    });
    setMessage(
      home + host === 100
        ? "Allocation applied and readiness fully recomputed."
        : "Allocation applied. Readiness is blocked because the total is not 100%.",
    );
  }
  function reset() {
    const initialCase = MOBILITY_CASE_FIXTURES.find(
      (item) => item.caseId === caseRecord.caseId,
    );
    if (!initialCase) {
      setMessage("This newly created case already reflects its current session defaults.");
      return;
    }
    resetCase(caseRecord.caseId);
    setAllocation({
      home: String(initialCase.compensationHomePct),
      host: String(initialCase.compensationHostPct),
    });
    setMessage("Representative defaults restored.");
  }
  function calculateTax(e: React.FormEvent) {
    e.preventDefault();
    const outcome = calculateTaxForCase(caseRecord.caseId, {
      taxYear: taxInputs.taxYear,
      stayAtHomeBaseSalary: Number(taxInputs.stayAtHomeBaseSalary),
      hypotheticalTaxRate: Number(taxInputs.hypotheticalTaxRate),
      actualHomeLiability: Number(taxInputs.actualHomeLiability),
      actualHostLiability: Number(taxInputs.actualHostLiability),
    });
    setMessage(
      "error" in outcome
        ? outcome.error
        : "Tax equalization recalculated from the current UAT session inputs.",
    );
  }
  function settleTax() {
    const outcome = settleTaxForCase(caseRecord.caseId);
    setMessage(
      "error" in outcome
        ? outcome.error
        : "Settlement completed. The existing Tax obligation was resolved and Readiness was fully recomputed.",
    );
  }
  return (
    <main style={shell}>
      <div style={wrap}>
        <header style={header}>
          <div>
            <Link href="/uat/mobility" style={back}>
              ← Mobility case queue
            </Link>
            <div style={eyebrow}>{caseRecord.caseId}</div>
            <h1 style={h1}>
              {caseRecord.employeeName} · {caseRecord.homeCountry} →{" "}
              {caseRecord.hostCountry}
            </h1>
            <p style={muted}>
              {caseRecord.assignmentType} assignment ·{" "}
              {caseRecord.lifecycleStatus} · Owner {caseRecord.owner}
            </p>
          </div>
          <span
            style={{
              ...statusPill,
              background:
                evaluation.computedStatus === "READY"
                  ? "#def5eb"
                  : evaluation.computedStatus === "BLOCKED"
                    ? "#fee9e7"
                    : "#fff0cf",
            }}
          >
            {evaluation.computedStatus.replaceAll("_", " ")}
          </span>
        </header>
        <div style={notice}>
          <strong>UAT session data</strong>
          <span>
            Edits reset on reload and never become production records.
          </span>
          <button style={linkButton} onClick={reset}>
            Reset defaults
          </button>
        </div>
        <nav style={tabbar}>
          {tabs.map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              style={{
                ...tabButton,
                background: tab === x ? "#173b32" : "transparent",
                color: tab === x ? "white" : "#425049",
              }}
            >
              {x}
            </button>
          ))}
        </nav>
        {message && (
          <div role="status" style={messageBox}>
            {message}
          </div>
        )}
        {tab === "Overview" && (
          <section style={grid}>
            <Card title="Assignment">
              <Detail
                label="Employee"
                value={`${caseRecord.employeeId} · ${caseRecord.employeeName}`}
              />
              <Detail
                label="Dates"
                value={`${caseRecord.startDate} → ${caseRecord.endDate ?? "No fixed end"}`}
              />
              <Detail label="Payroll model" value={caseRecord.payrollModel} />
            </Card>
            <Card title="Latest completed evaluation">
              <Detail
                label="Status"
                value={evaluation.computedStatus.replaceAll("_", " ")}
              />
              <Detail
                label="Evaluation version"
                value={String(evaluation.evaluationVersion)}
              />
              <Detail
                label="Open issues"
                value={String(evaluation.blockers.length)}
              />
              <Detail
                label="Payroll activation"
                value={
                  evaluation.computedStatus === "READY" ? "Allowed" : "Blocked"
                }
              />
            </Card>
            <Card title="Corridor controls">
              <Detail
                label="Totalization agreement"
                value={
                  caseRecord.totalizationAgreement
                    ? "Configured"
                    : "Not configured"
                }
              />
              <Detail
                label="DTAA"
                value={caseRecord.dtaaExists ? "Configured" : "Not configured"}
              />
              <Detail
                label="Default day threshold"
                value={`${caseRecord.defaultDayThreshold} days`}
              />
            </Card>
          </section>
        )}
        {tab === "Immigration" && (
          <section style={panel}>
            <SectionHead
              title="Immigration obligations"
              copy="Mobility displays the case-filtered view. Compliance owns obligation status changes and the combined readiness operation."
            />
            <Link
              href={`/uat/compliance/mobility?caseId=${encodeURIComponent(caseRecord.caseId)}`}
              style={{
                ...secondary,
                display: "inline-block",
                textDecoration: "none",
                marginBottom: 14,
              }}
            >
              Manage in Compliance
            </Link>
            {caseObligations
              .filter((x) => x.workstream === "IMMIGRATION")
              .map((item) => (
                <Obligation key={item.obligationId} item={item} />
              ))}
            {!caseObligations.some((x) => x.workstream === "IMMIGRATION") && (
              <Controlled
                title="Immigration record needed"
                current="No immigration obligation is configured for this fixture."
                unsupported="Work authorization cannot be inferred from assignment type."
                reason="Payroll activation must remain blocked for a newly configured corridor."
                next="Create the visa or work-permit obligation and attach a source reference."
              />
            )}
          </section>
        )}
        {tab === "Days" && (
          <section style={grid}>
            <Card title="Day threshold">
              <Detail
                label="Host days"
                value={String(caseRecord.currentHostDays)}
              />
              <Detail
                label="Corridor threshold"
                value={String(caseRecord.defaultDayThreshold)}
              />
              <Detail
                label="Position"
                value={
                  caseRecord.currentHostDays > caseRecord.defaultDayThreshold
                    ? "Breached"
                    : "Under threshold"
                }
              />
              <form onSubmit={addDay} style={{ marginTop: 14 }}>
                <label style={label}>
                  Add evidenced host day
                  <input
                    type="date"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    style={input}
                  />
                </label>
                <button style={primary}>Add day and recompute</button>
              </form>
            </Card>
            <Card title="Control behavior">
              <p style={muted}>
                A threshold breach with no shadow payroll configuration creates
                a blocker automatically. Totals are derived from day entries in
                the full implementation, not treated as an independent source
                record.
              </p>
            </Card>
          </section>
        )}
        {tab === "Compensation" && (
          <section style={grid}>
            <Card title="Cost allocation">
              <form onSubmit={applyAllocation}>
                <label style={label}>
                  Home allocation %
                  <input
                    type="number"
                    min="0"
                    value={allocation.home}
                    onChange={(e) =>
                      setAllocation((x) => ({ ...x, home: e.target.value }))
                    }
                    style={input}
                  />
                </label>
                <label style={label}>
                  Host allocation %
                  <input
                    type="number"
                    min="0"
                    value={allocation.host}
                    onChange={(e) =>
                      setAllocation((x) => ({ ...x, host: e.target.value }))
                    }
                    style={input}
                  />
                </label>
                <p style={{ ...muted, fontWeight: 800 }}>
                  Total{" "}
                  {Number(allocation.home || 0) + Number(allocation.host || 0)}%
                </p>
                <button style={primary}>Apply and recompute</button>
              </form>
            </Card>
            <Card title="Downstream use">
              <Detail label="Payroll model" value={caseRecord.payrollModel} />
              <Detail
                label="Readiness rule"
                value="Allocation must total 100%"
              />
              <Detail label="Re-entry" value="Payroll reads this case value" />
            </Card>
          </section>
        )}
        {tab === "Equity" && (
          <Controlled
            title="Equity sourcing is blocked"
            current="No grant master or jurisdictional vesting-day inputs are connected for this case."
            unsupported="RSU and ESOP sourced income and perquisite reporting are not calculated."
            reason="Producing a monetary result without grant and workday evidence would be misleading."
            next="Connect a versioned grant record, vest schedule and jurisdictional workdays, then verify the deterministic sourcing rule."
          />
        )}
        {tab === "Tax" && (
          taxRecord ? (
            <section style={panel}>
              <SectionHead
                title="Tax equalization settlement"
                copy="Deterministic UAT calculation from session inputs. Actual liabilities are entered values, not country-tax engine outputs."
              />
              <div style={notice}>
                <strong>UAT session data</strong>
                <span>Tax inputs and results reset on reload.</span>
              </div>
              <form onSubmit={calculateTax} style={grid}>
                {(
                  [
                    ["taxYear", "Tax year", "text"],
                    ["stayAtHomeBaseSalary", "Stay-at-home base salary (₹)", "number"],
                    ["hypotheticalTaxRate", "Hypothetical tax rate (%)", "number"],
                    ["actualHomeLiability", "Actual home liability (₹)", "number"],
                    ["actualHostLiability", "Actual host liability (₹)", "number"],
                  ] as const
                ).map(([key, text, type]) => (
                  <label key={key} style={label}>
                    {text}
                    <input
                      type={type}
                      min={type === "number" ? "0" : undefined}
                      step={key === "hypotheticalTaxRate" ? "0.01" : "1"}
                      value={taxInputs[key]}
                      onChange={(e) =>
                        setTaxInputs((current) => ({
                          ...current,
                          [key]: e.target.value,
                        }))
                      }
                      style={input}
                    />
                  </label>
                ))}
                <div style={{ alignSelf: "end", marginBottom: 11 }}>
                  <button style={primary}>Calculate true-up</button>
                </div>
              </form>
              <div style={{ ...grid, marginTop: 18 }}>
                <Detail label="Status" value={taxRecord.trueUpStatus.toUpperCase()} />
                <Detail label="Assignment mechanism" value="Full tax equalization" />
                <Detail label="Hypothetical tax basis" value={`${formatInr(taxRecord.stayAtHomeBaseSalary)} base salary only`} />
                <Detail label="Hypothetical withholding" value={formatInr(taxRecord.hypotheticalWithholding)} />
                <Detail label="Treaty method" value={taxRecord.treatyReliefMethod === "CREDIT" ? "Foreign tax credit method" : "No treaty relief"} />
                <Detail label="Treaty relief" value={formatInr(taxRecord.treatyRelief)} />
                <Detail label="Combined actual liability" value={formatInr(taxRecord.combinedActualLiability)} />
                <Detail label="Double-taxation exposure" value={formatInr(taxRecord.doubleTaxationExposure)} />
                <Detail
                  label="Settlement"
                  value={`${settlementLabel(taxRecord.settlementDirection)} ${formatInr(taxRecord.settlementAmount)}`}
                />
              </div>
              <div style={{ ...issue, marginTop: 12, borderColor: caseRecord.dtaaExists ? "#bcd9ce" : "#efb3a9" }}>
                <strong>{caseRecord.dtaaExists ? "DTAA relief applied" : "No DTAA — exposure shown explicitly"}</strong>
                <p style={muted}>
                  {caseRecord.dtaaExists
                    ? `Credit method: relief equals the lower of entered home and host liabilities, ${formatInr(taxRecord.treatyRelief)}. Combined actual liability of ${formatInr(taxRecord.combinedActualLiability)} is shown after relief.`
                    : `Potential double-taxation exposure is ${formatInr(taxRecord.doubleTaxationExposure)}; no relief is assumed.`}
                </p>
              </div>
              <div style={{ ...detail, marginTop: 12 }}>
                <small style={{ color: "#6c7872" }}>Excluded from hypothetical tax basis</small>
                <strong style={{ display: "block", marginTop: 4 }}>
                  COLA {formatInr(taxRecord.excludedAssignmentAllowances.cola)} · Hardship {formatInr(taxRecord.excludedAssignmentAllowances.hardship)} · Housing premium {formatInr(taxRecord.excludedAssignmentAllowances.housingPremium)}
                </strong>
              </div>
              {taxRecord.trueUpStatus === "calculated" && (
                <button onClick={settleTax} style={{ ...primary, marginTop: 14 }}>
                  Mark settlement completed
                </button>
              )}
              {taxRecord.trueUpStatus === "settled" && (
                <div style={{ ...success, marginTop: 14 }}>
                  Settlement completed. The Tax obligation is resolved through the shared Readiness operation.
                </div>
              )}
            </section>
          ) : taxMechanism === "TAX_PROTECTION" ? (
            <Controlled
              title="Tax protection only"
              current={`${caseRecord.assignmentType}. Travel-day tax facts are tracked for this case.`}
              unsupported="Hypothetical withholding and tax equalization settlement are disabled for business travelers."
              reason="The employer reimburses only incremental tax caused by business travel days."
              next="Enter verified home baseline tax and travel-day incremental tax to calculate the protection reimbursement."
            />
          ) : (
            <Controlled
              title="Host payroll and host terms"
              current={`${caseRecord.assignmentType}. Tax equalization and tax protection are not applicable.`}
              unsupported="No hypothetical withholding, equalization true-up or travel tax protection is calculated."
              reason="Permanent transfer and localization move the employee onto host payroll and host employment terms."
              next="Complete host payroll onboarding and local tax registration outside the equalization workflow."
            />
          )
        )}
        {tab === "Payroll" && (
          <section style={grid}>
            <Card title="Payroll activation">
              <Detail label="Current model" value={caseRecord.payrollModel} />
              {caseRecord.assignmentType === "Permanent transfer" && (
                <>
                  <Detail
                    label="India employment cessation"
                    value={caseRecord.indiaEmploymentCessationDate ?? "Missing"}
                  />
                  <Detail
                    label="Host payroll commencement"
                    value={caseRecord.hostPayrollCommencementDate ?? "Missing"}
                  />
                  <Detail
                    label="Post-transfer allocation"
                    value={`${caseRecord.compensationHomePct}% India · ${caseRecord.compensationHostPct}% host`}
                  />
                </>
              )}
              <Detail
                label="Latest evaluation"
                value={`v${evaluation.evaluationVersion} · ${evaluation.computedStatus.replaceAll("_", " ")}`}
              />
              <Detail
                label="Activation"
                value={
                  evaluation.computedStatus === "READY" ? "Allowed" : "Blocked"
                }
              />
              <p style={muted}>
                Payroll reads the latest completed Readiness evaluation. It does
                not keep a second status field.
              </p>
            </Card>
            <Card title="Runs touched">
              <p style={muted}>
                {caseRecord.assignmentType === "Permanent transfer"
                  ? "India payroll ends on the cessation date. Regular payroll moves fully to the host country from the host commencement date; later India payments must be prior-period settlements."
                  : "No production payroll run is linked in this UAT. This view displays activation status only."}
              </p>
            </Card>
          </section>
        )}
        {tab === "Readiness" && (
          <section style={panel}>
            <SectionHead
              title="Completed readiness evaluation"
              copy={`Evaluation v${evaluation.evaluationVersion}. Obligation revisions and evaluation versions are separate counters.`}
            />
            <div style={grid}>
              {evaluation.blockers.map((b, i) => (
                <article
                  key={i}
                  style={{
                    ...issue,
                    borderColor:
                      b.severity === "BLOCKER" ? "#efb3a9" : "#ecd69e",
                  }}
                >
                  <strong>
                    {b.workstream} · {b.severity}
                  </strong>
                  <p style={muted}>{b.reason}</p>
                </article>
              ))}
            </div>
            {!evaluation.blockers.length && (
              <div style={success}>Every evaluated workstream is ready.</div>
            )}
            <h3>Source obligation revisions</h3>
            <div style={grid}>
              {Object.entries(evaluation.sourceObligationRevisions).map(
                ([id, rev]) => (
                  <Detail key={id} label={id} value={`Revision ${rev}`} />
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
function SectionHead({ title, copy }: { title: string; copy: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={h2}>{title}</h2>
      <p style={muted}>{copy}</p>
    </div>
  );
}
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article style={panel}>
      <h2 style={h2}>{title}</h2>
      {children}
    </article>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={detail}>
      <small style={{ color: "#6c7872" }}>{label}</small>
      <strong style={{ display: "block", marginTop: 4 }}>{value}</strong>
    </div>
  );
}
function Obligation({ item }: { item: ObligationRecord }) {
  return (
    <article style={obligation}>
      <div>
        <strong>{item.obligationType}</strong>
        <p style={muted}>{item.reason}</p>
        <small>
          {item.obligationId} · Revision {item.revision} · Due{" "}
          {item.dueDate ?? "Not set"}
        </small>
      </div>
      <span style={statusPill}>{item.status}</span>
    </article>
  );
}
function Controlled({
  title,
  current,
  unsupported,
  reason,
  next,
}: {
  title: string;
  current: string;
  unsupported: string;
  reason: string;
  next: string;
}) {
  return (
    <section style={panel}>
      <h2 style={h2}>{title}</h2>
      <div style={grid}>
        <Detail label="Current inputs" value={current} />
        <Detail label="Unsupported" value={unsupported} />
        <Detail label="Why blocked" value={reason} />
        <Detail label="Needed next" value={next} />
      </div>
    </section>
  );
}
function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
function settlementLabel(
  direction: "EMPLOYER_OWES_ASSIGNEE" | "ASSIGNEE_OWES_EMPLOYER" | "BALANCED",
) {
  if (direction === "EMPLOYER_OWES_ASSIGNEE") return "Employer owes assignee";
  if (direction === "ASSIGNEE_OWES_EMPLOYER") return "Assignee owes employer";
  return "Balanced";
}
const shell = {
    minHeight: "100vh",
    background: "#f4f7f6",
    color: "#17251f",
    fontFamily: "Inter,Arial,sans-serif",
  } as const,
  wrap = {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "28px 20px 64px",
  } as const,
  header = {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 18,
  } as const,
  back = {
    display: "inline-block",
    color: "#0b6b52",
    textDecoration: "none",
    fontWeight: 700,
    marginBottom: 13,
  } as const,
  eyebrow = {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: ".09em",
    fontWeight: 800,
    color: "#356557",
  } as const,
  h1 = { fontSize: 30, margin: "5px 0" } as const,
  h2 = { fontSize: 19, margin: "0 0 12px" } as const,
  muted = { color: "#62706a", margin: "6px 0", lineHeight: 1.5 } as const,
  statusPill = {
    padding: "8px 11px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  } as const,
  notice = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    padding: 13,
    background: "#eaf6f1",
    border: "1px solid #bcd9ce",
    borderRadius: 11,
    color: "#1b5949",
    marginBottom: 15,
  } as const,
  linkButton = {
    marginLeft: "auto",
    border: 0,
    background: "transparent",
    color: "#0b6b52",
    fontWeight: 800,
  } as const,
  tabbar = {
    display: "flex",
    gap: 7,
    overflowX: "auto",
    padding: "7px",
    background: "white",
    border: "1px solid #dfe6e3",
    borderRadius: 12,
    marginBottom: 15,
  } as const,
  tabButton = {
    border: 0,
    borderRadius: 8,
    padding: "9px 12px",
    fontWeight: 750,
    whiteSpace: "nowrap",
  } as const,
  messageBox = {
    padding: 12,
    border: "1px solid #c8dbd4",
    background: "#f0f8f5",
    borderRadius: 9,
    marginBottom: 14,
  } as const,
  panel = {
    background: "white",
    border: "1px solid #dfe6e3",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  } as const,
  grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 12,
  } as const,
  detail = {
    padding: "11px 12px",
    border: "1px solid #e3e9e6",
    borderRadius: 9,
    background: "#fafcfb",
    marginBottom: 8,
  } as const,
  label = { display: "block", fontWeight: 700, marginBottom: 11 } as const,
  input = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    marginTop: 5,
    padding: "10px",
    border: "1px solid #cbd5d1",
    borderRadius: 8,
  } as const,
  primary = {
    border: 0,
    background: "#173b32",
    color: "white",
    padding: "10px 13px",
    borderRadius: 8,
    fontWeight: 800,
  } as const,
  secondary = {
    border: "1px solid #bcc9c4",
    background: "white",
    color: "#24312c",
    padding: "8px 10px",
    borderRadius: 8,
    fontWeight: 700,
  } as const,
  obligation = {
    display: "flex",
    justifyContent: "space-between",
    gap: 15,
    alignItems: "center",
    padding: 15,
    border: "1px solid #e0e6e3",
    borderRadius: 11,
    marginBottom: 10,
    flexWrap: "wrap",
  } as const,
  issue = {
    padding: 14,
    border: "1px solid",
    borderRadius: 10,
    background: "#fffdf8",
  } as const,
  success = {
    padding: 14,
    background: "#eaf6f1",
    borderRadius: 10,
    color: "#1b5949",
  } as const;
