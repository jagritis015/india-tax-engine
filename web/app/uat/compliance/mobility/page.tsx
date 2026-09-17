"use client";
import { useState } from "react";
import {
  applyObligationChangeAndEvaluateReadiness,
  evaluateMobilityReadiness,
  MOBILITY_CASE_FIXTURES,
  OBLIGATION_FIXTURES,
  type ObligationRecord,
} from "@/lib/uat-global-mobility";

export default function MobilityCompliance() {
  const requested =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("caseId")
      : null;
  const initial =
    MOBILITY_CASE_FIXTURES.find((x) => x.caseId === requested) ??
    MOBILITY_CASE_FIXTURES[0];
  const [caseRecord, setCaseRecord] = useState(initial);
  const [obligations, setObligations] = useState(OBLIGATION_FIXTURES);
  const [evaluation, setEvaluation] = useState(() =>
    evaluateMobilityReadiness(initial, OBLIGATION_FIXTURES),
  );
  const [message, setMessage] = useState("");
  function selectCase(id: string) {
    const next = MOBILITY_CASE_FIXTURES.find((x) => x.caseId === id)!;
    setCaseRecord(next);
    setEvaluation(evaluateMobilityReadiness(next, obligations));
    setMessage("");
  }
  function update(item: ObligationRecord, status: ObligationRecord["status"]) {
    const outcome = applyObligationChangeAndEvaluateReadiness(
      { caseRecord, obligations, evaluation },
      {
        caseId: caseRecord.caseId,
        obligationId: item.obligationId,
        expectedRevision: item.revision,
        change: { status },
      },
    );
    if ("error" in outcome) {
      setMessage(outcome.error);
      return;
    }
    setObligations(outcome.result.obligations);
    setEvaluation(outcome.result.evaluation);
    setMessage(
      `Combined operation succeeded. Obligation revision ${item.revision + 1}; completed readiness evaluation ${outcome.result.evaluation.evaluationVersion}.`,
    );
  }
  const rows = obligations.filter((x) => x.caseId === caseRecord.caseId);
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f6",
        fontFamily: "Inter,Arial,sans-serif",
        color: "#17251f",
      }}
    >
      <div
        style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 64px" }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <div>
            <a
              href="/uat/mobility"
              style={{
                color: "#0b6b52",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              ← Global mobility
            </a>
            <h1>Mobility compliance obligations</h1>
            <p style={{ color: "#62706a" }}>
              Compliance owns changes. Mobility reads this same shared
              obligation collection.
            </p>
          </div>
          <a
            href={`/uat/mobility/case?caseId=${encodeURIComponent(caseRecord.caseId)}`}
            style={secondary}
          >
            Open case
          </a>
        </header>
        <div style={notice}>
          <strong>UAT session data</strong>
          <span>
            Changes reset on reload and do not create production records.
          </span>
        </div>
        <section style={panel}>
          <label style={{ fontWeight: 700 }}>
            Case
            <select
              value={caseRecord.caseId}
              onChange={(e) => selectCase(e.target.value)}
              style={input}
            >
              {MOBILITY_CASE_FIXTURES.map((x) => (
                <option key={x.caseId} value={x.caseId}>
                  {x.employeeName} · {x.homeCountry} → {x.hostCountry}
                </option>
              ))}
            </select>
          </label>
        </section>
        {message && <div style={messageBox}>{message}</div>}
        <section style={panel}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ marginTop: 0 }}>Shared obligations</h2>
              <p style={{ color: "#62706a" }}>
                Every change validates the obligation revision and recomputes
                the full case readiness before replacing session state.
              </p>
            </div>
            <strong>
              {evaluation.computedStatus.replaceAll("_", " ")} · Evaluation v
              {evaluation.evaluationVersion}
            </strong>
          </div>
          {rows.map((item) => (
            <article key={item.obligationId} style={row}>
              <div>
                <strong>{item.obligationType}</strong>
                <p style={{ color: "#62706a", lineHeight: 1.5 }}>
                  {item.reason}
                </p>
                <small>
                  {item.workstream} · Revision {item.revision} ·{" "}
                  {item.jurisdiction}
                </small>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {(["OPEN", "RESOLVED", "CANCELLED"] as const).map((status) => (
                  <button
                    key={status}
                    disabled={item.status === status}
                    onClick={() => update(item, status)}
                    style={{
                      ...button,
                      opacity: item.status === status ? 0.5 : 1,
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {!rows.length && (
            <p>
              No obligation fixture is configured for this case. Native
              workstream controls still determine readiness.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
const panel = {
    background: "white",
    border: "1px solid #dfe6e3",
    borderRadius: 14,
    padding: 18,
    marginTop: 15,
  } as const,
  row = {
    display: "flex",
    justifyContent: "space-between",
    gap: 15,
    alignItems: "center",
    padding: "15px 0",
    borderBottom: "1px solid #e7ecea",
    flexWrap: "wrap",
  } as const,
  input = {
    display: "block",
    width: "100%",
    marginTop: 6,
    padding: 10,
    border: "1px solid #cbd5d1",
    borderRadius: 8,
  } as const,
  button = {
    border: "1px solid #bcc9c4",
    background: "white",
    padding: "8px 10px",
    borderRadius: 8,
    fontWeight: 700,
  } as const,
  secondary = {
    ...button,
    color: "#24312c",
    textDecoration: "none",
    height: "fit-content",
  } as const,
  notice = {
    display: "flex",
    gap: 9,
    flexWrap: "wrap",
    padding: 13,
    background: "#eaf6f1",
    border: "1px solid #bcd9ce",
    borderRadius: 10,
    marginTop: 16,
    color: "#1b5949",
  } as const,
  messageBox = {
    padding: 12,
    border: "1px solid #c8dbd4",
    background: "#f0f8f5",
    borderRadius: 9,
    marginTop: 14,
  } as const;
