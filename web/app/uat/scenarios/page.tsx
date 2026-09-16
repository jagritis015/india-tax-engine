"use client";

import { useMemo, useState, type CSSProperties } from "react";

type CatalogItem = {
  id: string;
  kind: "payroll" | "immigration";
  label: string;
  description: string;
  population: number;
};

type Check = { label: string; expected: string | number; actual: string | number; passed: boolean };

type Run = {
  id: string;
  kind: "payroll" | "immigration";
  label: string;
  description: string;
  expected: Record<string, number>;
  actual: Record<string, number>;
  checks: Check[];
  allChecksPassed: boolean;
  rows: Array<Record<string, unknown>>;
};

const scenarios: CatalogItem[] = [
  { id: "monthly-baseline-100", kind: "payroll", label: "September monthly payroll", description: "100 employee run with unresolved source records excluded from calculated totals.", population: 100 },
  { id: "festival-variable-pay-100", kind: "payroll", label: "Festival bonus and sales commission", description: "Full company run with bonus and commission events layered onto regular salary.", population: 100 },
  { id: "new-joiner-proration-6", kind: "payroll", label: "Six new joiners", description: "Prorated September salary inputs for employees joining on different dates.", population: 6 },
  { id: "statutory-boundaries-7", kind: "payroll", label: "PT, PF and rebate boundaries", description: "Exact Karnataka PT, PF ceiling, rebate and marginal relief threshold cases.", population: 7 },
  { id: "tds-true-up-4", kind: "payroll", label: "TDS year-to-date true up", description: "Same current salary with different prior TDS credits.", population: 4 },
  { id: "fail-closed-controls-4", kind: "payroll", label: "Fail-closed payroll controls", description: "Unsupported surcharge, negative input and unresolved employee master cases.", population: 4 },
  { id: "immigration-controls-8", kind: "immigration", label: "Immigration evidence and expiry controls", description: "Complete, missing, expired, coverage-gap and invalid assignment evidence.", population: 8 },
];

const datasets = [
  ["employee-master", "100 employee master"],
  ["baseline-inputs", "Baseline payroll inputs"],
  ["baseline-expected", "Baseline expected results"],
  ["payroll-scenario-inputs", "Payroll scenario inputs"],
  ["payroll-scenario-expected", "Payroll scenario expected results"],
  ["immigration-inputs", "Immigration case inputs"],
  ["immigration-expected", "Immigration expected results"],
  ["test-script", "UAT test script"],
] as const;

const moneyKeys = new Set(["grossPayroll", "totalTds", "totalEmployeePf", "totalProfessionalTax", "totalDeductions", "netPayable", "grossSalary", "tds", "employeePf", "professionalTax", "netSalary"]);
const cash = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function readable(value: unknown, key = "") {
  if (value == null) return "Not calculated";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return moneyKeys.has(key) ? cash.format(value) : value.toLocaleString("en-IN");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replaceAll("_", " ");
}

function label(value: string) {
  return value.replace(/([A-Z])/g, " $1").replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

export default function ScenarioLabPage() {
  const [selectedId, setSelectedId] = useState("monthly-baseline-100");
  const [run, setRun] = useState<Run | null>(null);
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("Select a scenario and run it against the live calculation service.");

  const selected = scenarios.find((item) => item.id === selectedId) ?? scenarios[0];

  async function runScenario() {
    setRunning(true);
    setMessage("Running the scenario and reconciling actual results to the expected data sheet…");
    try {
      const response = await fetch("/api/uat/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ scenarioId: selectedId }),
      });
      const body = await response.json() as Run & { error?: string };
      if (!response.ok) throw new Error(body.error || "Scenario run failed");
      setRun(body);
      setMessage(body.allChecksPassed ? "Run complete. Every expected total and status matched." : "Run complete with reconciliation differences. Review the failed checks below.");
    } catch (error) {
      setRun(null);
      setMessage(error instanceof Error ? error.message : "Scenario run failed safely.");
    } finally {
      setRunning(false);
    }
  }

  function chooseScenario(id: string) {
    setSelectedId(id);
    setRun(null);
    setQuery("");
    setStatusFilter("all");
    setMessage("Scenario selected. Run it to calculate and reconcile the results.");
  }

  const filteredRows = useMemo(() => {
    if (!run) return [];
    return run.rows.filter((row) => {
      const text = Object.values(row).filter((value) => typeof value !== "object").join(" ").toLowerCase();
      const status = String(row.status ?? row.actualStatus ?? "").toLowerCase();
      return text.includes(query.toLowerCase()) && (statusFilter === "all" || status.includes(statusFilter));
    });
  }, [run, query, statusFilter]);

  const visibleColumns = run?.kind === "immigration"
    ? ["scenarioId", "label", "expectedStatus", "actualStatus", "passedGates", "openActions", "criticalAlerts", "nextAction"]
    : ["employeeId", "employeeName", "eventType", "status", "grossSalary", "tds", "employeePf", "professionalTax", "totalDeductions", "netSalary", "reviewReason"];

  return <main style={{ minHeight: "100vh", background: "#f5f7f8", color: "#17202a", fontFamily: "Inter,ui-sans-serif,system-ui,sans-serif" }}>
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "30px 18px 64px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ maxWidth: 820 }}><div style={eyebrow}>Niva Labs · September 2026 · Private UAT</div><h1 style={{ margin: "7px 0 8px", fontSize: 34 }}>Real-use Scenario Lab</h1><p style={lead}>Run realistic employee, payroll and immigration cases through the live deterministic services. Every run compares actual results with a versioned expected-output sheet.</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><a href="/uat-scenarios/india-payroll-os-real-use-uat-pack.xlsx" download style={primaryLink}>Download complete Excel pack</a><a href="/" style={secondaryLink}>Back to Payroll OS</a></div>
      </header>

      <section style={{ ...panel, background: "#173b32", color: "white" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          {[["Employees", "100"], ["Executable scenarios", "7"], ["Payroll records tested", "221"], ["Immigration cases", "8"]].map(([itemLabel, value]) => <div key={itemLabel} style={{ padding: 13, border: "1px solid #ffffff25", borderRadius: 10, background: "#ffffff0c" }}><small style={{ color: "#bed2cc" }}>{itemLabel}</small><strong style={{ display: "block", fontSize: 24, marginTop: 4 }}>{value}</strong></div>)}
        </div>
      </section>

      <section style={panel}>
        <div><h2 style={{ margin: "0 0 5px" }}>1. Choose a scenario</h2><p style={muted}>These cases use synthetic identities but realistic payroll events, threshold values and exception paths.</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(255px,1fr))", gap: 10, marginTop: 14 }}>
          {scenarios.map((scenario) => <button type="button" onClick={() => chooseScenario(scenario.id)} key={scenario.id} style={{ textAlign: "left", padding: 14, border: selectedId === scenario.id ? "2px solid #28785c" : "1px solid #dce2e7", borderRadius: 11, background: selectedId === scenario.id ? "#eef8f3" : "white", color: "inherit", cursor: "pointer" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{scenario.label}</strong><span style={pill}>{scenario.population} records</span></div><p style={{ ...muted, marginTop: 8 }}>{scenario.description}</p></button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16 }}><button type="button" onClick={runScenario} disabled={running} style={{ ...primaryButton, opacity: running ? .65 : 1 }}>{running ? "Running and reconciling…" : `Run ${selected.label}`}</button><span role="status" style={{ fontSize: 13, color: run?.allChecksPassed ? "#28785c" : "#64707a" }}>{message}</span></div>
      </section>

      {run && <>
        <section style={panel} data-testid="scenario-reconciliation">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}><div><h2 style={{ margin: "0 0 5px" }}>2. Reconciliation</h2><p style={muted}>Expected values come from the downloadable UAT pack. Actual values come from this live run.</p></div><span style={{ ...pill, padding: "7px 10px", color: run.allChecksPassed ? "#246a4c" : "#9b3528", background: run.allChecksPassed ? "#e7f6ed" : "#ffe9e5" }}>{run.allChecksPassed ? "ALL CHECKS PASSED" : "DIFFERENCES FOUND"}</span></div>
          <div style={{ overflowX: "auto", marginTop: 14 }}><table style={table}><thead><tr>{["Check", "Expected", "Actual", "Result"].map((heading) => <th key={heading} style={th}>{heading}</th>)}</tr></thead><tbody>{run.checks.map((check) => <tr key={check.label}><td style={td}><strong>{label(check.label)}</strong></td><td style={td}>{readable(check.expected, check.label)}</td><td style={td}>{readable(check.actual, check.label)}</td><td style={td}><strong style={{ color: check.passed ? "#28785c" : "#9b3528" }}>{check.passed ? "Pass" : "Fail"}</strong></td></tr>)}</tbody></table></div>
        </section>

        <section style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}><div><h2 style={{ margin: "0 0 5px" }}>3. Employee and case results</h2><p style={muted}>{filteredRows.length} of {run.rows.length} records shown.</p></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input aria-label="Search scenario results" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search results" style={input}/><select aria-label="Filter scenario status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={input}><option value="all">All statuses</option><option value="calculated">Calculated</option><option value="review">Review or action required</option><option value="blocked">Blocked</option><option value="precheck">Precheck complete</option></select></div></div>
          <div style={{ overflowX: "auto", marginTop: 14 }}><table style={{ ...table, minWidth: run.kind === "immigration" ? 1050 : 1380 }}><thead><tr>{visibleColumns.map((column) => <th key={column} style={th}>{label(column)}</th>)}</tr></thead><tbody>{filteredRows.map((row, index) => <tr key={String(row.employeeId ?? row.scenarioId ?? index)}>{visibleColumns.map((column) => <td key={column} style={{ ...td, maxWidth: column === "eventType" || column === "nextAction" || column === "reviewReason" ? 280 : undefined }}>{readable(row[column], column)}</td>)}</tr>)}</tbody></table></div>
        </section>
      </>}

      <section style={panel}>
        <div><h2 style={{ margin: "0 0 5px" }}>4. Download individual data sheets</h2><p style={muted}>Use these CSV files for import testing, independent calculations and defect evidence.</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 9, marginTop: 14 }}>{datasets.map(([id, datasetLabel]) => <a key={id} href={`/api/uat/scenarios/download?dataset=${id}`} download style={{ ...secondaryLink, display: "flex", justifyContent: "space-between", gap: 8 }}><span>{datasetLabel}</span><strong>CSV</strong></a>)}</div>
      </section>

      <section style={{ padding: 15, border: "1px solid #ead4ad", borderRadius: 12, background: "#fff9ec", color: "#66542f" }}><strong>Testing boundary</strong><p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>The records are synthetic. The monetary outputs are produced by the current verified September 2026 Karnataka UAT engine. Unsupported periods, jurisdictions and legal determinations remain review required or blocked.</p></section>
    </div>
  </main>;
}

const panel: CSSProperties = { background: "white", border: "1px solid #dce2e7", borderRadius: 13, padding: 18, marginBottom: 18 };
const eyebrow: CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: ".09em", fontWeight: 850, color: "#286552" };
const lead: CSSProperties = { margin: 0, color: "#5d6772", lineHeight: 1.55 };
const muted: CSSProperties = { margin: 0, color: "#67727c", lineHeight: 1.45, fontSize: 13 };
const primaryButton: CSSProperties = { border: "1px solid #173b32", background: "#173b32", color: "white", padding: "10px 13px", borderRadius: 8, fontWeight: 800, cursor: "pointer" };
const primaryLink: CSSProperties = { textDecoration: "none", border: "1px solid #173b32", background: "#173b32", color: "white", padding: "10px 13px", borderRadius: 8, fontWeight: 800 };
const secondaryLink: CSSProperties = { textDecoration: "none", border: "1px solid #c9d2d8", background: "white", color: "#24313b", padding: "10px 12px", borderRadius: 8, fontWeight: 700, fontSize: 13 };
const pill: CSSProperties = { padding: "4px 7px", borderRadius: 999, background: "#edf2f3", color: "#57636c", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" };
const input: CSSProperties = { boxSizing: "border-box", padding: "9px 10px", border: "1px solid #cbd4da", borderRadius: 8, fontSize: 14, background: "white", minWidth: 190 };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #dce2e7", background: "#f7f9fa", color: "#69747d", fontSize: 11, whiteSpace: "nowrap" };
const td: CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #edf0f2", fontSize: 13, verticalAlign: "top" };
