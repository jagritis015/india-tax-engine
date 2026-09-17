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
  const { obligations, evaluations, updateCaseAndEvaluate, resetCase } =
    useMobilitySession();
  const evaluation = evaluations[caseRecord.caseId];
  const [tab, setTab] = useState<Tab>("Overview");
  const [message, setMessage] = useState("");
  const [newDay, setNewDay] = useState("");
  const [allocation, setAllocation] = useState({
    home: String(caseRecord.compensationHomePct),
    host: String(caseRecord.compensationHostPct),
  });
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
          <Controlled
            title="Host-country monetary tax is blocked"
            current={`DTAA configured: ${caseRecord.dtaaExists ? "Yes" : "No"}. ${caseRecord.unsupportedCalculations.join(" ") || "No fixture-level unsupported calculation is recorded."}`}
            unsupported="This Phase 1 case workspace does not calculate unverified host tax, treaty relief or tax equalization true-up."
            reason={
              caseRecord.dtaaExists
                ? "The host monetary engine is not verified."
                : "No DTAA calculation path is configured, so double-taxation exposure is shown instead of omitted."
            }
            next="Add verified corridor rules, deterministic host tax calculations and reviewed policy inputs."
          />
        )}
        {tab === "Payroll" && (
          <section style={grid}>
            <Card title="Payroll activation">
              <Detail label="Current model" value={caseRecord.payrollModel} />
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
                No production payroll run is linked in Phase 1. This UAT
                displays activation status only and does not create host or
                shadow payroll money.
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
