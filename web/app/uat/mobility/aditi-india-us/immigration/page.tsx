"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import {
  EMPTY_IMMIGRATION_SUPPORT_INPUT,
  IMMIGRATION_SUPPORT_STORAGE_KEY,
  REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT,
  type ImmigrationAssessment,
  type ImmigrationAssistantAnswer,
  type ImmigrationSupportInput,
} from "@/lib/uat-immigration-support";

type ApiResponse = {
  assessment: ImmigrationAssessment;
  assistant: ImmigrationAssistantAnswer | null;
  supportedQuestions: string[];
  operatingMode: string;
  notice: string;
};

type ChatEntry = { question: string; response: ImmigrationAssistantAnswer };

const suggestedQuestions = [
  "What blockers are open?",
  "What should we do next?",
  "Can payroll activate?",
  "What expires before the assignment ends?",
  "Summarize the evidence on file.",
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "datetime-local";
  placeholder?: string;
}) {
  return <label style={labelStyle}>{label}<input aria-label={label} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} /></label>;
}

export default function ImmigrationSupportPage() {
  const [draft, setDraft] = useState<ImmigrationSupportInput>(() => clone(EMPTY_IMMIGRATION_SUPPORT_INPUT));
  const [assessment, setAssessment] = useState<ImmigrationAssessment | null>(null);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Preflight not run");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      const stored = window.localStorage.getItem(IMMIGRATION_SUPPORT_STORAGE_KEY);
      if (stored) {
        const restored = JSON.parse(stored) as ImmigrationSupportInput;
        queueMicrotask(() => {
          if (!active) return;
          setDraft({ ...EMPTY_IMMIGRATION_SUPPORT_INPUT, ...restored });
          setMessage("Restored from this browser. Run the preflight to refresh status.");
        });
      }
    } catch {
      queueMicrotask(() => {
        if (!active) return;
        setError(true);
        setMessage("Saved UAT facts could not be restored.");
      });
    }
    return () => { active = false; };
  }, []);

  function update(key: keyof ImmigrationSupportInput, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setAssessment(null);
    setMessage("Facts changed. Run the preflight again.");
    setError(false);
  }

  async function callSupport(input: ImmigrationSupportInput, assistantQuestion?: string): Promise<ApiResponse> {
    const response = await fetch("/api/mobility/aditi-india-us/immigration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ input, question: assistantQuestion }),
    });
    if (!response.ok) throw new Error("Immigration support API unavailable");
    return response.json() as Promise<ApiResponse>;
  }

  async function runPreflight() {
    setBusy(true);
    setError(false);
    setMessage("Running deterministic evidence checks…");
    try {
      const result = await callSupport(draft);
      setAssessment(result.assessment);
      setMessage(`Preflight complete: ${result.assessment.status.replaceAll("_", " ")}`);
    } catch {
      setAssessment(null);
      setError(true);
      setMessage("Preflight failed safely. No approval or payroll activation was granted.");
    } finally {
      setBusy(false);
    }
  }

  function loadRepresentativeCase() {
    setDraft(clone(REPRESENTATIVE_IMMIGRATION_SUPPORT_INPUT));
    setAssessment(null);
    setChat([]);
    setError(false);
    setMessage("Representative UAT case loaded. Run the preflight to assess it.");
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(IMMIGRATION_SUPPORT_STORAGE_KEY, JSON.stringify(draft));
      setError(false);
      setMessage("UAT facts saved only in this browser.");
    } catch {
      setError(true);
      setMessage("Browser storage is unavailable. Facts were not saved.");
    }
  }

  function clearDraft() {
    setDraft(clone(EMPTY_IMMIGRATION_SUPPORT_INPUT));
    setAssessment(null);
    setChat([]);
    window.localStorage.removeItem(IMMIGRATION_SUPPORT_STORAGE_KEY);
    setError(false);
    setMessage("Local immigration UAT facts cleared.");
  }

  async function askCopilot(event: FormEvent) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked || busy) return;
    setBusy(true);
    setError(false);
    try {
      const result = await callSupport(draft, asked);
      setAssessment(result.assessment);
      if (result.assistant) setChat((current) => [...current, { question: asked, response: result.assistant! }]);
      setQuestion("");
      setMessage("Copilot answer grounded in the current case facts.");
    } catch {
      setError(true);
      setMessage("Copilot failed safely. No conclusion was generated.");
    } finally {
      setBusy(false);
    }
  }

  const statusColor = assessment?.status === "PRECHECK_COMPLETE" ? "#246a4c" : assessment?.status === "BLOCKED" ? "#9b3528" : "#805300";
  const statusBackground = assessment?.status === "PRECHECK_COMPLETE" ? "#e7f6ed" : assessment?.status === "BLOCKED" ? "#ffe8e3" : "#fff0cf";

  return <main style={{ minHeight: "100vh", background: "#f4f7f8", color: "#18212b", fontFamily: "Inter,ui-sans-serif,system-ui,sans-serif" }}>
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 18px 64px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ maxWidth: 820 }}>
          <div style={eyebrow}>India to United States mobility · Private UAT</div>
          <h1 style={{ margin: "7px 0 8px", fontSize: 32 }}>Immigration Copilot and automated preflight</h1>
          <p style={{ margin: 0, color: "#5d6772", lineHeight: 1.55 }}>Capture case facts once, run deterministic evidence and expiry checks, generate a review queue, and ask case-grounded questions. The assistant does not interpret immigration law or approve work authorization.</p>
        </div>
        <a href="/uat/mobility/aditi-india-us" style={secondaryLink}>Back to mobility case</a>
      </header>

      <section style={{ background: "linear-gradient(135deg,#173b32,#095f4a)", color: "white", borderRadius: 15, padding: 20, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ ...eyebrow, color: "#c6ddd6" }}>Zero-cost automation mode</div>
            <h2 style={{ margin: "6px 0" }}>Evidence grounded, deterministic, reviewable</h2>
            <p style={{ margin: 0, color: "#d0e0db", maxWidth: 760 }}>No paid AI service is called. Every status comes from visible fields and versioned rules. Copilot answers cite the facts on file and fail closed on legal conclusions.</p>
          </div>
          <span style={{ padding: "7px 10px", borderRadius: 999, background: "#ffffff18", border: "1px solid #ffffff30", fontSize: 12, fontWeight: 800 }}>Rule immigration-support-uat-v1</span>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))", gap: 11, marginBottom: 18 }}>
        {[
          ["Preflight", assessment?.status.replaceAll("_", " ") ?? "NOT RUN"],
          ["Automated gates", assessment ? `${assessment.automationSummary.passedGateCount} / ${assessment.automationSummary.totalGateCount} pass` : "Awaiting preflight"],
          ["Open actions", assessment ? String(assessment.automationSummary.openActionCount) : "Awaiting preflight"],
          ["Payroll activation", "BLOCKED"],
        ].map(([label, value]) => <article key={label} style={{ background: "white", border: "1px solid #dce2e7", borderRadius: 12, padding: 15 }}><small style={{ color: "#707b85" }}>{label}</small><strong style={{ display: "block", marginTop: 5, color: label === "Preflight" ? statusColor : undefined }}>{value}</strong></article>)}
      </section>

      <section style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div><h2 style={{ margin: "0 0 6px" }}>1. Case facts and evidence</h2><p style={muted}>Representative values are synthetic UAT evidence, not production records.</p></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={loadRepresentativeCase} style={secondaryButton}>Load representative UAT case</button>
            <button type="button" onClick={saveDraft} style={secondaryButton}>Save in this browser</button>
            <button type="button" onClick={clearDraft} style={secondaryButton}>Clear local facts</button>
          </div>
        </div>

        <h3 style={groupHeading}>Assignment</h3>
        <div style={fieldGrid}>
          <Field label="Case ID" value={draft.caseId} onChange={(value) => update("caseId", value)} />
          <Field label="Employee name" value={draft.employeeName} onChange={(value) => update("employeeName", value)} />
          <Field label="Citizenship country" value={draft.citizenshipCountry} onChange={(value) => update("citizenshipCountry", value)} />
          <Field label="Host country" value={draft.hostCountry} onChange={(value) => update("hostCountry", value)} />
          <Field label="Assignment start" type="date" value={draft.assignmentStartDate} onChange={(value) => update("assignmentStartDate", value)} />
          <Field label="Assignment end" type="date" value={draft.assignmentEndDate} onChange={(value) => update("assignmentEndDate", value)} />
        </div>

        <h3 style={groupHeading}>Role and classification facts</h3>
        <div style={fieldGrid}>
          <Field label="Visa category" value={draft.visaCategory} onChange={(value) => update("visaCategory", value)} placeholder="Captured fact, not an approval" />
          <Field label="Role title" value={draft.roleTitle} onChange={(value) => update("roleTitle", value)} />
          <Field label="Host employer" value={draft.hostEmployer} onChange={(value) => update("hostEmployer", value)} />
          <Field label="Primary worksite" value={draft.primaryWorksite} onChange={(value) => update("primaryWorksite", value)} />
        </div>

        <h3 style={groupHeading}>Evidence and review provenance</h3>
        <div style={fieldGrid}>
          <Field label="Petition or approval reference" value={draft.petitionOrApprovalReference} onChange={(value) => update("petitionOrApprovalReference", value)} />
          <Field label="Work-authorization reference" value={draft.workAuthorizationReference} onChange={(value) => update("workAuthorizationReference", value)} />
          <Field label="Work authorization starts" type="date" value={draft.workAuthorizationStartDate} onChange={(value) => update("workAuthorizationStartDate", value)} />
          <Field label="Work authorization ends" type="date" value={draft.workAuthorizationEndDate} onChange={(value) => update("workAuthorizationEndDate", value)} />
          <Field label="Passport reference" value={draft.passportReference} onChange={(value) => update("passportReference", value)} />
          <Field label="Passport expiry" type="date" value={draft.passportExpiryDate} onChange={(value) => update("passportExpiryDate", value)} />
          <Field label="Reviewed by" value={draft.reviewedBy} onChange={(value) => update("reviewedBy", value)} />
          <Field label="Review date and time" type="datetime-local" value={draft.reviewedAt} onChange={(value) => update("reviewedAt", value)} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          <button type="button" onClick={runPreflight} disabled={busy} style={{ ...primaryButton, opacity: busy ? .65 : 1 }}>{busy ? "Checking…" : "Run immigration preflight"}</button>
          <span role="status" style={{ fontSize: 13, color: error ? "#9b3528" : "#5f6b75" }}>{message}</span>
        </div>
      </section>

      {assessment && <>
        <section style={panel} data-testid="immigration-preflight-results">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div><h2 style={{ margin: "0 0 6px" }}>2. Automated preflight results</h2><p style={muted}>Each result is traceable to entered evidence. Passing the preflight does not create a legal determination.</p></div>
            <span style={{ padding: "7px 10px", borderRadius: 999, color: statusColor, background: statusBackground, fontSize: 12, fontWeight: 850 }}>{assessment.status.replaceAll("_", " ")}</span>
          </div>
          <div style={{ display: "grid", gap: 9, marginTop: 15 }}>
            {assessment.gates.map((item) => <article key={item.id} style={{ padding: 13, border: "1px solid #e0e5e9", borderRadius: 10, background: item.status === "PASS" ? "#f7fbf8" : item.status === "BLOCKED" ? "#fff6f4" : "#fffaf1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><strong>{item.label}</strong><span style={{ fontSize: 11, fontWeight: 800 }}>{item.status.replaceAll("_", " ")}</span></div>
              <p style={{ margin: "7px 0 0", color: "#5d6872", lineHeight: 1.45, fontSize: 13 }}>{item.detail}</p>
              {item.evidence.length > 0 && <p style={{ margin: "7px 0 0", color: "#7a838b", fontSize: 12 }}>Evidence: {item.evidence.join(" · ")}</p>}
            </article>)}
          </div>
        </section>

        <section style={{ ...panel, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
          <div>
            <h2 style={{ margin: "0 0 6px" }}>3. Automated action queue</h2>
            <p style={muted}>Ordered operational work generated from the failed checks.</p>
            <div style={{ display: "grid", gap: 9, marginTop: 14 }}>{assessment.actions.map((action) => <article key={action.id} style={{ border: "1px solid #dfe5e8", borderRadius: 10, padding: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{action.title}</strong><span style={{ fontSize: 10, fontWeight: 850, color: action.priority === "CRITICAL" ? "#9b3528" : "#805300" }}>{action.priority}</span></div><p style={{ margin: "6px 0 0", fontSize: 13, color: "#5f6972" }}>{action.reason}</p><small style={{ display: "block", marginTop: 7, color: "#77818a" }}>Owner: {action.owner}</small></article>)}</div>
          </div>
          <div>
            <h2 style={{ margin: "0 0 6px" }}>Alerts</h2>
            <p style={muted}>Expiry and evidence risks that need attention.</p>
            <div style={{ display: "grid", gap: 9, marginTop: 14 }}>{assessment.alerts.length ? assessment.alerts.map((alert) => <article key={alert.id} style={{ padding: 12, borderRadius: 10, border: "1px solid #ead5c9", background: alert.severity === "CRITICAL" ? "#fff2ef" : "#fffaf1" }}><strong style={{ fontSize: 11 }}>{alert.severity}</strong><p style={{ margin: "5px 0 0", color: "#5f6972", fontSize: 13 }}>{alert.message}</p></article>) : <div style={{ padding: 13, borderRadius: 10, background: "#eef8f2", color: "#286149" }}>No expiry or missing-evidence alerts from the current facts.</div>}</div>
          </div>
        </section>
      </>}

      <section style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><h2 style={{ margin: "0 0 6px" }}>4. Immigration Copilot</h2><p style={muted}>Ask about this case’s blockers, evidence, expiry coverage, status or next actions.</p></div>
          <span style={{ padding: "6px 9px", height: "fit-content", borderRadius: 999, background: "#edf3f1", fontSize: 11, fontWeight: 800 }}>Case grounded · no paid model</span>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 13 }}>{suggestedQuestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => setQuestion(suggestion)} style={chipButton}>{suggestion}</button>)}</div>
        <form onSubmit={askCopilot} style={{ display: "flex", gap: 9, marginTop: 13, flexWrap: "wrap" }}>
          <input aria-label="Ask Immigration Copilot" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: What blockers are open?" style={{ ...inputStyle, flex: "1 1 420px", marginTop: 0 }} />
          <button type="submit" disabled={busy || !question.trim()} style={{ ...primaryButton, opacity: busy || !question.trim() ? .65 : 1 }}>Ask Copilot</button>
        </form>
        <div style={{ display: "grid", gap: 10, marginTop: 15 }}>
          {chat.length === 0 && <div style={{ padding: 14, borderRadius: 10, background: "#f7f9fa", color: "#69737d", fontSize: 13 }}>No questions asked yet. Copilot will use the current form facts and the same deterministic preflight rules.</div>}
          {chat.map((entry, index) => <article key={`${entry.question}-${index}`} style={{ border: "1px solid #dce3e6", borderRadius: 10, overflow: "hidden" }}><div style={{ padding: 11, background: "#f4f7f7", fontWeight: 750 }}>{entry.question}</div><div style={{ padding: 13, lineHeight: 1.5, color: "#4f5b65" }}>{entry.response.answer}{entry.response.sources.length > 0 && <p style={{ margin: "9px 0 0", fontSize: 12, color: "#78818a" }}>Grounded in: {entry.response.sources.join(" · ")}</p>}<p style={{ margin: "8px 0 0", fontSize: 12, color: "#8a5a00" }}>Specialist review required.</p></div></article>)}
        </div>
      </section>

      <section style={{ padding: 15, border: "1px solid #eccbc3", borderRadius: 12, background: "#fff7f5", color: "#6f4a42" }}><strong>Hard safety boundary</strong><p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>Payroll activation is always blocked in this workspace. A named immigration specialist must validate the evidence and record the legal determination in the authoritative case system. This UAT tool does not replace counsel or government records.</p></section>
    </div>
  </main>;
}

const panel: CSSProperties = { background: "white", border: "1px solid #dce2e7", borderRadius: 13, padding: 18, marginBottom: 18 };
const fieldGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(225px,1fr))", gap: 12 };
const labelStyle: CSSProperties = { display: "block", fontSize: 13, color: "#4f5b65" };
const inputStyle: CSSProperties = { width: "100%", boxSizing: "border-box", marginTop: 6, padding: "10px 11px", border: "1px solid #cbd4da", borderRadius: 8, fontSize: 15, color: "#18212b", background: "white" };
const groupHeading: CSSProperties = { margin: "20px 0 10px", fontSize: 15 };
const muted: CSSProperties = { margin: 0, color: "#66717b", lineHeight: 1.45, fontSize: 13 };
const eyebrow: CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: ".09em", fontWeight: 850, color: "#286552" };
const primaryButton: CSSProperties = { border: "1px solid #173b32", background: "#173b32", color: "white", padding: "10px 13px", borderRadius: 8, fontWeight: 800, cursor: "pointer" };
const secondaryButton: CSSProperties = { border: "1px solid #bdc8ce", background: "white", color: "#24313b", padding: "9px 11px", borderRadius: 8, fontWeight: 700, cursor: "pointer" };
const chipButton: CSSProperties = { border: "1px solid #c7d4d0", background: "#f5faf8", color: "#285749", padding: "7px 9px", borderRadius: 999, fontSize: 12, cursor: "pointer" };
const secondaryLink: CSSProperties = { textDecoration: "none", color: "inherit", border: "1px solid #cfd6dc", background: "white", padding: "10px 13px", borderRadius: 9 };
