"use client";
import { Fragment, useMemo, useState } from "react";
import {
  daysToExpiry,
  MOBILITY_CASE_FIXTURES,
  MOBILITY_EVALUATIONS,
  type MobilityCase,
  type ReadinessStatus,
} from "@/lib/uat-global-mobility";

const statusLabel = (status: ReadinessStatus) => status.replaceAll("_", " ");
export default function GlobalMobilityQueue() {
  const [cases, setCases] = useState(MOBILITY_CASE_FIXTURES);
  const [query, setQuery] = useState("");
  const [corridor, setCorridor] = useState("All");
  const [assignment, setAssignment] = useState("All");
  const [owner, setOwner] = useState("All");
  const [status, setStatus] = useState<"All" | ReadinessStatus>("All");
  const [expanded, setExpanded] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    employeeName: "",
    hostCountry: "",
    assignmentType: "Short-term",
    owner: "Meera Shah",
  });
  const evaluations = useMemo(
    () =>
      Object.fromEntries(
        cases.map((c) => [
          c.caseId,
          MOBILITY_EVALUATIONS[c.caseId] ?? {
            computedStatus: "BLOCKED",
            blockers: [
              {
                reason:
                  "New UAT case requires workstream setup before readiness can be evaluated.",
              },
            ],
          },
        ]),
      ),
    [cases],
  );
  const rows = useMemo(
    () =>
      cases.filter((c) => {
        const e = evaluations[c.caseId];
        return (
          c.employeeName.toLowerCase().includes(query.toLowerCase()) &&
          (corridor === "All" ||
            `${c.homeCountry} → ${c.hostCountry}` === corridor) &&
          (assignment === "All" || c.assignmentType === assignment) &&
          (owner === "All" || c.owner === owner) &&
          (status === "All" || e.computedStatus === status)
        );
      }),
    [cases, evaluations, query, corridor, assignment, owner, status],
  );
  const counts = {
    ACTIVE: cases.filter((c) => c.lifecycleStatus === "Active").length,
    REVIEW_REQUIRED: cases.filter(
      (c) => evaluations[c.caseId].computedStatus === "REVIEW_REQUIRED",
    ).length,
    BLOCKED: cases.filter(
      (c) => evaluations[c.caseId].computedStatus === "BLOCKED",
    ).length,
    READY: cases.filter((c) => evaluations[c.caseId].computedStatus === "READY")
      .length,
  };
  function createCase(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.employeeName.trim() || !draft.hostCountry.trim()) return;
    const n = cases.length + 1;
    const item: MobilityCase = {
      caseId: `MOB-UAT-NEW-${n}`,
      employeeId: `NVL-UAT-${100 + n}`,
      employeeName: draft.employeeName.trim(),
      homeCountry: "India",
      hostCountry: draft.hostCountry.trim(),
      assignmentType: draft.assignmentType as MobilityCase["assignmentType"],
      lifecycleStatus: "Pre-assignment",
      startDate: "2026-10-01",
      endDate: "2027-03-31",
      owner: draft.owner,
      payrollModel: "Standard",
      workAuthorizationExpiry: null,
      totalizationAgreement: false,
      dtaaExists: false,
      defaultDayThreshold: 183,
      currentHostDays: 0,
      compensationHomePct: 100,
      compensationHostPct: 0,
      unsupportedCalculations: [
        "Corridor tax and immigration rules are not configured for this new UAT case.",
      ],
      lastUpdated: "Current session",
    };
    setCases((x) => [item, ...x]);
    setShowCreate(false);
  }
  const corridors = [
      "All",
      ...new Set(cases.map((c) => `${c.homeCountry} → ${c.hostCountry}`)),
    ],
    assignments = ["All", ...new Set(cases.map((c) => c.assignmentType))],
    owners = ["All", ...new Set(cases.map((c) => c.owner))];
  return (
    <main style={shell}>
      <div style={wrap}>
        <header style={header}>
          <div>
            <div style={eyebrow}>Global Mobility Operations</div>
            <h1 style={h1}>Mobility case queue</h1>
            <p style={muted}>
              Manage assignments across employees and corridors. Readiness is
              computed from live UAT workstream state.
            </p>
          </div>
          <div style={actions}>
            <button
              style={secondary}
              onClick={() => setShowCreate(!showCreate)}
            >
              Create mobility case
            </button>
            <a style={secondary} href="/">
              Back to Payroll OS
            </a>
          </div>
        </header>
        <div style={notice}>
          <strong>UAT session data</strong>
          <span>
            Changes are private to this browser session and reset on reload. No
            production records are created.
          </span>
          <button
            onClick={() => {
              setCases(MOBILITY_CASE_FIXTURES);
              setStatus("All");
            }}
            style={linkButton}
          >
            Reset defaults
          </button>
        </div>
        {showCreate && (
          <form onSubmit={createCase} style={panel}>
            <h2 style={h2}>Create synthetic mobility case</h2>
            <div style={formGrid}>
              <label>
                Employee
                <input
                  value={draft.employeeName}
                  onChange={(e) =>
                    setDraft((x) => ({ ...x, employeeName: e.target.value }))
                  }
                  style={input}
                />
              </label>
              <label>
                Host country
                <input
                  value={draft.hostCountry}
                  onChange={(e) =>
                    setDraft((x) => ({ ...x, hostCountry: e.target.value }))
                  }
                  style={input}
                />
              </label>
              <label>
                Assignment type
                <select
                  value={draft.assignmentType}
                  onChange={(e) =>
                    setDraft((x) => ({ ...x, assignmentType: e.target.value }))
                  }
                  style={input}
                >
                  {[
                    "Short-term",
                    "Long-term",
                    "Permanent transfer",
                    "Business traveler",
                    "Commuter",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Owner
                <select
                  value={draft.owner}
                  onChange={(e) =>
                    setDraft((x) => ({ ...x, owner: e.target.value }))
                  }
                  style={input}
                >
                  {owners
                    .filter((x) => x !== "All")
                    .map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                </select>
              </label>
            </div>
            <button style={primary}>Add to this session</button>
          </form>
        )}
        <section style={countGrid}>
          {[
            { label: "Active", value: counts.ACTIVE, filter: "All" as const },
            {
              label: "Review required",
              value: counts.REVIEW_REQUIRED,
              filter: "REVIEW_REQUIRED" as const,
            },
            {
              label: "Blocked",
              value: counts.BLOCKED,
              filter: "BLOCKED" as const,
            },
            { label: "Ready", value: counts.READY, filter: "READY" as const },
          ].map((x) => (
            <button
              key={x.label}
              onClick={() => setStatus(x.filter)}
              style={{
                ...countCard,
                borderColor: status === x.filter ? "#0b6b52" : "#dfe6e3",
              }}
            >
              <span>{x.label}</span>
              <strong>{x.value}</strong>
            </button>
          ))}
        </section>
        <section style={panel}>
          <div style={filters}>
            <input
              aria-label="Search employee"
              placeholder="Search employee name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={input}
            />
            <select
              aria-label="Filter corridor"
              value={corridor}
              onChange={(e) => setCorridor(e.target.value)}
              style={input}
            >
              {corridors.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              aria-label="Filter assignment"
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
              style={input}
            >
              {assignments.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              aria-label="Filter status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              style={input}
            >
              {["All", "BLOCKED", "REVIEW_REQUIRED", "READY"].map((x) => (
                <option key={x}>{x.replaceAll("_", " ")}</option>
              ))}
            </select>
            <select
              aria-label="Filter owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              style={input}
            >
              {owners.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Home → Host",
                    "Assignment",
                    "Dates",
                    "Work authorization",
                    "Payroll",
                    "Readiness",
                    "Owner",
                    "Updated",
                    "",
                  ].map((x) => (
                    <th key={x} style={th}>
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const e = evaluations[c.caseId],
                    days = daysToExpiry(c.workAuthorizationExpiry);
                  return (
                    <Fragment key={c.caseId}>
                      <tr>
                        <td style={td}>
                          <strong>{c.employeeName}</strong>
                          <small style={small}>{c.employeeId}</small>
                        </td>
                        <td style={td}>
                          {c.homeCountry} → {c.hostCountry}
                        </td>
                        <td style={td}>{c.assignmentType}</td>
                        <td style={td}>
                          {c.startDate}
                          <small style={small}>
                            {c.endDate ?? "No fixed end"}
                          </small>
                        </td>
                        <td style={td}>
                          {days === null ? "Evidence needed" : `${days} days`}
                          <small style={small}>
                            {c.workAuthorizationExpiry ?? "No expiry recorded"}
                          </small>
                        </td>
                        <td style={td}>{c.payrollModel}</td>
                        <td style={td}>
                          <button
                            onClick={() =>
                              setExpanded(expanded === c.caseId ? "" : c.caseId)
                            }
                            style={{
                              ...pill,
                              background:
                                e.computedStatus === "READY"
                                  ? "#def5eb"
                                  : e.computedStatus === "BLOCKED"
                                    ? "#fee9e7"
                                    : "#fff0cf",
                            }}
                          >
                            {statusLabel(e.computedStatus)}
                          </button>
                        </td>
                        <td style={td}>{c.owner}</td>
                        <td style={td}>{c.lastUpdated.slice(0, 10)}</td>
                        <td style={td}>
                          <a
                            href={`/uat/mobility/case?caseId=${encodeURIComponent(c.caseId)}`}
                            style={openLink}
                          >
                            Open case
                          </a>
                        </td>
                      </tr>
                      {expanded === c.caseId && (
                        <tr>
                          <td
                            colSpan={10}
                            style={{ ...td, background: "#fffaf0" }}
                          >
                            <strong>Why this case is not ready</strong>
                            <ul style={{ marginBottom: 0 }}>
                              {e.blockers.length ? (
                                e.blockers.map((b: any, i: number) => (
                                  <li key={i}>{b.reason}</li>
                                ))
                              ) : (
                                <li>No blocker remains.</li>
                              )}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <div style={empty}>No mobility cases match these filters.</div>
          )}
        </section>
      </div>
    </main>
  );
}
const shell = {
    minHeight: "100vh",
    background: "#f4f7f6",
    color: "#17251f",
    fontFamily: "Inter,Arial,sans-serif",
  } as const,
  wrap = {
    maxWidth: 1460,
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
  actions = { display: "flex", gap: 9, flexWrap: "wrap" } as const,
  eyebrow = {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: ".09em",
    fontWeight: 800,
    color: "#356557",
  } as const,
  h1 = { fontSize: 32, margin: "6px 0" } as const,
  h2 = { fontSize: 19, margin: "0 0 14px" } as const,
  muted = { color: "#62706a", margin: 0, lineHeight: 1.5 } as const,
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
    marginBottom: 16,
  } as const,
  linkButton = {
    marginLeft: "auto",
    border: 0,
    background: "transparent",
    color: "#0b6b52",
    fontWeight: 800,
  } as const,
  panel = {
    background: "white",
    border: "1px solid #dfe6e3",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  } as const,
  countGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
    gap: 12,
    marginBottom: 16,
  } as const,
  countCard = {
    textAlign: "left",
    padding: 16,
    border: "2px solid #dfe6e3",
    borderRadius: 13,
    background: "white",
  } as const,
  filters = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
    gap: 9,
    marginBottom: 15,
  } as const,
  formGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 11,
    marginBottom: 14,
  } as const,
  input = {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 5,
    padding: "10px 11px",
    border: "1px solid #cbd5d1",
    borderRadius: 8,
    background: "white",
  } as const,
  table = {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1250,
  } as const,
  th = {
    textAlign: "left",
    padding: "10px 11px",
    fontSize: 12,
    color: "#66736d",
    background: "#f7f9f8",
    borderBottom: "1px solid #e1e6e4",
  } as const,
  td = {
    padding: "12px 11px",
    fontSize: 13,
    borderBottom: "1px solid #edf0ee",
    verticalAlign: "top",
  } as const,
  small = { display: "block", marginTop: 4, color: "#75817b" } as const,
  pill = {
    border: 0,
    padding: "6px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  } as const,
  openLink = {
    color: "#0b6b52",
    fontWeight: 800,
    textDecoration: "none",
    whiteSpace: "nowrap",
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
    padding: "10px 13px",
    borderRadius: 8,
    fontWeight: 700,
    textDecoration: "none",
  } as const,
  empty = { padding: 30, textAlign: "center", color: "#66736d" } as const;
