"use client";
import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildMobilityCaseFromPayrollEmployee,
  daysToExpiry,
  type ReadinessStatus,
} from "@/lib/uat-global-mobility";
import { UAT_EMPLOYEES } from "@/lib/uat-niva-data";
import { useMobilitySession } from "./session-store";

const statusLabel = (status: ReadinessStatus) => status.replaceAll("_", " ");
export default function GlobalMobilityQueue() {
  const { cases, evaluations, addCase, resetSession } = useMobilitySession();
  const [query, setQuery] = useState("");
  const [corridor, setCorridor] = useState("All");
  const [assignment, setAssignment] = useState("All");
  const [owner, setOwner] = useState("All");
  const [status, setStatus] = useState<"All" | ReadinessStatus>("All");
  const [lifecycle, setLifecycle] = useState<"All" | "Active">("All");
  const [expanded, setExpanded] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [employeeSuggestionsOpen, setEmployeeSuggestionsOpen] = useState(false);
  const [draft, setDraft] = useState({
    employeeId: "",
    employeeSearch: "",
    hostCountry: "",
    assignmentType: "Short-term",
    owner: "Meera Shah",
  });
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
          (lifecycle === "All" || c.lifecycleStatus === lifecycle) &&
          (status === "All" || e.computedStatus === status)
        );
      }),
    [cases, evaluations, query, corridor, assignment, owner, lifecycle, status],
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
    const employee = UAT_EMPLOYEES.find((item) => item.id === draft.employeeId);
    if (!employee) {
      setCreateError("Select an employee from the Niva Labs payroll list.");
      return;
    }
    if (cases.some((item) => item.employeeId === employee.id)) {
      setCreateError(`${employee.name} already has a mobility case in this session.`);
      return;
    }
    if (!draft.hostCountry.trim()) {
      setCreateError("Enter the host country.");
      return;
    }
    const n = cases.length + 1;
    const item = buildMobilityCaseFromPayrollEmployee({
      employee,
      hostCountry: draft.hostCountry,
      assignmentType: draft.assignmentType as Parameters<
        typeof buildMobilityCaseFromPayrollEmployee
      >[0]["assignmentType"],
      owner: draft.owner,
      ordinal: n,
    });
    addCase(item);
    setCreateError("");
    setDraft((current) => ({
      ...current,
      employeeId: "",
      employeeSearch: "",
      hostCountry: "",
    }));
    setShowCreate(false);
  }
  const availableEmployees = UAT_EMPLOYEES.filter(
    (employee) => !cases.some((item) => item.employeeId === employee.id),
  );
  const employeeMatches = useMemo(() => {
    const term = draft.employeeSearch.trim().toLowerCase();
    if (term.length < 2 || draft.employeeId) return [];
    return availableEmployees
      .filter((employee) =>
        `${employee.name} ${employee.id} ${employee.role}`
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 6);
  }, [availableEmployees, draft.employeeId, draft.employeeSearch]);
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
            <Link style={secondary} href="/">
              Back to Payroll OS
            </Link>
          </div>
        </header>
        <div style={notice}>
          <strong>UAT session data</strong>
          <span>
            Changes are private to this browser session and reset on reload. No
          </span>
          <button
            onClick={() => {
              resetSession();
              setStatus("All");
              setLifecycle("All");
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
              <label style={{ position: "relative" }}>
                Employee from Niva Labs payroll
                <input
                  placeholder="Search employee name or ID"
                  value={draft.employeeSearch}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={employeeSuggestionsOpen && employeeMatches.length > 0}
                  aria-controls="niva-payroll-employee-suggestions"
                  onChange={(e) => {
                    const value = e.target.value;
                    setDraft((current) => ({
                      ...current,
                      employeeSearch: value,
                      employeeId: "",
                    }));
                    setEmployeeSuggestionsOpen(value.trim().length >= 2);
                    setCreateError("");
                  }}
                  onFocus={() =>
                    setEmployeeSuggestionsOpen(
                      draft.employeeSearch.trim().length >= 2 && !draft.employeeId,
                    )
                  }
                  onBlur={() => setEmployeeSuggestionsOpen(false)}
                  style={input}
                />
                {employeeSuggestionsOpen && employeeMatches.length > 0 && (
                  <div
                    id="niva-payroll-employee-suggestions"
                    role="listbox"
                    style={suggestionList}
                  >
                    {employeeMatches.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setDraft((current) => ({
                            ...current,
                            employeeSearch: employee.name,
                            employeeId: employee.id,
                          }));
                          setEmployeeSuggestionsOpen(false);
                          setCreateError("");
                        }}
                        style={suggestionOption}
                      >
                        <strong>{employee.name}</strong>
                        <span>{employee.id} · {employee.role}</span>
                      </button>
                    ))}
                  </div>
                )}
                {employeeSuggestionsOpen &&
                  draft.employeeSearch.trim().length >= 2 &&
                  employeeMatches.length === 0 && (
                    <div style={suggestionEmpty}>No matching payroll employee</div>
                  )}
                {draft.employeeId && (
                  <small style={small}>
                    Linked payroll employee: {draft.employeeId}
                  </small>
                )}
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
            {createError && <div role="alert" style={formError}>{createError}</div>}
            <button style={primary}>Add to this session</button>
          </form>
        )}
        <div style={dimensionLabel}>Assignment lifecycle</div>
        <section style={{ ...countGrid, gridTemplateColumns: "minmax(180px, 1fr)" }}>
          <button
            onClick={() => setLifecycle(lifecycle === "Active" ? "All" : "Active")}
            style={{
              ...countCard,
              borderColor: lifecycle === "Active" ? "#0b6b52" : "#dfe6e3",
            }}
          >
            <span>Active assignments</span>
            <strong>{counts.ACTIVE}</strong>
          </button>
        </section>
        <div style={dimensionLabel}>Readiness</div>
        <section style={countGrid}>
          {[
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
                          <Link
                            href={`/uat/mobility/case?caseId=${encodeURIComponent(c.caseId)}`}
                            style={openLink}
                          >
                            Open case
                          </Link>
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
  dimensionLabel = {
    margin: "4px 0 8px",
    color: "#66736d",
    fontSize: 13,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".06em",
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
  formError = {
    marginBottom: 12,
    padding: "10px 12px",
    border: "1px solid #efc4bd",
    borderRadius: 8,
    background: "#fff4f2",
    color: "#8a3025",
    fontSize: 13,
    fontWeight: 700,
  } as const,
  suggestionList = {
    position: "absolute",
    zIndex: 30,
    top: "calc(100% - 2px)",
    left: 0,
    right: 0,
    maxHeight: 280,
    overflowY: "auto",
    padding: 6,
    border: "1px solid #cbd5d1",
    borderRadius: 10,
    background: "white",
    boxShadow: "0 14px 34px rgba(20, 42, 34, .16)",
  } as const,
  suggestionOption = {
    display: "block",
    width: "100%",
    padding: "10px 11px",
    border: 0,
    borderRadius: 7,
    background: "white",
    color: "#17251f",
    textAlign: "left",
    cursor: "pointer",
  } as const,
  suggestionEmpty = {
    position: "absolute",
    zIndex: 30,
    top: "calc(100% - 2px)",
    left: 0,
    right: 0,
    padding: "12px 13px",
    border: "1px solid #cbd5d1",
    borderRadius: 10,
    background: "white",
    color: "#66736d",
    fontSize: 13,
    boxShadow: "0 14px 34px rgba(20, 42, 34, .12)",
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
