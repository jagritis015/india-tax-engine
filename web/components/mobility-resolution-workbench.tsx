"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  assessMobilityResolution,
  EMPTY_MOBILITY_RESOLUTION,
  MOBILITY_RESOLUTION_STORAGE_KEY,
  REPRESENTATIVE_MOBILITY_RESOLUTION,
  US_STATES,
  type HumanResolutionGateId,
  type MobilityResolutionDraft,
} from "@/lib/uat-mobility-resolution";

const fieldStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: 6,
  padding: "10px 11px",
  border: "1px solid #cfd6dc",
  borderRadius: 8,
  fontSize: 15,
  background: "white",
  color: "#18212b",
};

const labelStyle: CSSProperties = { display: "block", fontSize: 13, color: "#4f5b66" };

function cloneEmptyDraft(): MobilityResolutionDraft {
  return JSON.parse(JSON.stringify(EMPTY_MOBILITY_RESOLUTION)) as MobilityResolutionDraft;
}

function GateSection({
  id,
  title,
  owner,
  ready,
  errors,
  children,
}: {
  id: string;
  title: string;
  owner: string;
  ready: boolean;
  errors: string[];
  children: ReactNode;
}) {
  return <section id={id} style={{ scrollMarginTop: 20, border: "1px solid #dce2e7", borderRadius: 12, padding: 16, background: ready ? "#f5fbf7" : "white" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div><h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3><p style={{ margin: "5px 0 0", color: "#6b7480", fontSize: 13 }}>Owner: {owner}</p></div>
      <span data-testid={`${id}-status`} style={{ padding: "5px 9px", borderRadius: 999, fontSize: 11, fontWeight: 800, background: ready ? "#dff3e7" : "#fff0cf", color: ready ? "#246a4c" : "#805300" }}>{ready ? "TEST ANSWER COMPLETE" : "INPUT NEEDED"}</span>
    </div>
    <div style={{ marginTop: 14 }}>{children}</div>
    {!ready && <p style={{ margin: "12px 0 0", color: "#815200", fontSize: 13 }}>{errors[0]}</p>}
  </section>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label style={labelStyle}>{label}<input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={fieldStyle} /></label>;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={labelStyle}>{label}<input aria-label={label} type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} style={fieldStyle} /></label>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label style={labelStyle}>{label}<select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} style={fieldStyle}><option value="">Select…</option>{children}</select></label>;
}

export function MobilityResolutionWorkbench() {
  const [draft, setDraft] = useState<MobilityResolutionDraft>(() => cloneEmptyDraft());
  const [storageMessage, setStorageMessage] = useState("Not saved in this browser");
  const [storageError, setStorageError] = useState(false);
  const assessment = useMemo(() => assessMobilityResolution(draft), [draft]);

  useEffect(() => {
    let active = true;
    try {
      const stored = window.localStorage.getItem(MOBILITY_RESOLUTION_STORAGE_KEY);
      if (stored) {
        const restored = JSON.parse(stored) as MobilityResolutionDraft;
        queueMicrotask(() => {
          if (!active) return;
          setDraft(restored);
          setStorageMessage("Restored from this browser");
        });
      }
    } catch {
      queueMicrotask(() => {
        if (!active) return;
        setStorageMessage("Saved answers could not be restored");
        setStorageError(true);
      });
    }
    return () => { active = false; };
  }, []);

  function update<S extends keyof MobilityResolutionDraft, K extends keyof MobilityResolutionDraft[S]>(section: S, key: K, value: MobilityResolutionDraft[S][K]) {
    setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
    setStorageMessage("Unsaved changes");
    setStorageError(false);
  }

  function loadRepresentativeAnswers() {
    setDraft(JSON.parse(JSON.stringify(REPRESENTATIVE_MOBILITY_RESOLUTION)) as MobilityResolutionDraft);
    setStorageMessage("Sample answers loaded. Save them to keep them on this device.");
    setStorageError(false);
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(MOBILITY_RESOLUTION_STORAGE_KEY, JSON.stringify(draft));
      setStorageMessage(assessment.allHumanGatesReady ? "Saved. All five test forms are complete." : "Test draft saved on this device");
      setStorageError(false);
    } catch {
      setStorageMessage("Browser storage is unavailable; answers were not saved");
      setStorageError(true);
    }
  }

  function resetDraft() {
    setDraft(cloneEmptyDraft());
    window.localStorage.removeItem(MOBILITY_RESOLUTION_STORAGE_KEY);
    setStorageMessage("Local UAT answers cleared");
    setStorageError(false);
  }

  const gate = (id: HumanResolutionGateId) => assessment.gates[id];

  return <section style={{ background: "#f7fbfa", border: "1px solid #b9d6cc", borderRadius: 14, padding: 18, marginBottom: 18 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ maxWidth: 760 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".09em", fontWeight: 800, color: "#286552" }}>Start here</div>
        <h2 style={{ margin: "6px 0" }}>Test the five manual reviews</h2>
        <p style={{ margin: 0, color: "#56636d", lineHeight: 1.5 }}>Use sample answers or enter your own test values. Nothing entered here updates a real employee record or activates payroll.</p>
      </div>
      <div style={{ minWidth: 190, padding: 13, borderRadius: 10, background: assessment.allHumanGatesReady ? "#dff3e7" : "#fff0cf" }}>
        <small style={{ color: "#5d6772" }}>Test form progress</small>
        <strong data-testid="human-gate-progress" style={{ display: "block", marginTop: 4, fontSize: 22 }}>{assessment.readyCount} of {assessment.totalCount} complete</strong>
      </div>
    </div>

    <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 16 }}>
      <button type="button" onClick={loadRepresentativeAnswers} style={secondaryButton}>Fill sample answers</button>
      <button type="button" onClick={saveDraft} style={primaryButton}>Save test answers on this device</button>
      <button type="button" onClick={resetDraft} style={secondaryButton}>Clear test answers</button>
      <span role="status" style={{ alignSelf: "center", fontSize: 13, color: storageError ? "#9b3528" : "#5e6973" }}>{storageMessage}</span>
    </div>

    {assessment.allHumanGatesReady && <div data-testid="human-review-passed" style={{ marginTop: 16, padding: 13, border: "1px solid #b8dcca", borderRadius: 10, background: "#eaf8ef", color: "#245f46" }}><strong>Test form complete.</strong> This proves the five manual review forms work. Payroll remains off because these answers are stored only on this device and the US tax calculation engine is not connected.</div>}

    <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
      <GateSection id="resolution-location-evidence" title="1. Corroborate the pending U.S. day" owner="Mobility operations" ready={gate("location-evidence").ready} errors={gate("location-evidence").errors}>
        <div style={grid}>
          <TextField label="Corroborating evidence reference" value={draft.locationEvidence.evidenceReference} onChange={(value) => update("locationEvidence", "evidenceReference", value)} placeholder="I-94, ticket or travel-system reference" />
          <TextField label="Location evidence reviewer" value={draft.locationEvidence.reviewedBy} onChange={(value) => update("locationEvidence", "reviewedBy", value)} />
          <DateField label="Location review date and time" value={draft.locationEvidence.reviewedAt} onChange={(value) => update("locationEvidence", "reviewedAt", value)} />
        </div>
      </GateSection>

      <GateSection id="resolution-host-state" title="2. Establish the authoritative U.S. host state" owner="Mobility tax" ready={gate("host-state").ready} errors={gate("host-state").errors}>
        <div style={grid}>
          <SelectField label="Authoritative U.S. host state" value={draft.hostState.stateCode} onChange={(value) => update("hostState", "stateCode", value)}>{US_STATES.map(([code, name]) => <option value={code} key={code}>{name} ({code})</option>)}</SelectField>
          <TextField label="Assignment letter reference" value={draft.hostState.assignmentLetterReference} onChange={(value) => update("hostState", "assignmentLetterReference", value)} />
          <TextField label="Primary worksite reference" value={draft.hostState.primaryWorksiteReference} onChange={(value) => update("hostState", "primaryWorksiteReference", value)} />
          <TextField label="HR or payroll profile reference" value={draft.hostState.hrProfileReference} onChange={(value) => update("hostState", "hrProfileReference", value)} />
          <TextField label="Host-state reviewer" value={draft.hostState.reviewedBy} onChange={(value) => update("hostState", "reviewedBy", value)} />
          <DateField label="Host-state review date and time" value={draft.hostState.reviewedAt} onChange={(value) => update("hostState", "reviewedAt", value)} />
          <TextField label="Host-state approval reference" value={draft.hostState.approvalReference} onChange={(value) => update("hostState", "approvalReference", value)} />
        </div>
      </GateSection>

      <GateSection id="resolution-compensation-treatment" title="3. Resolve assignment compensation treatment" owner="Global payroll" ready={gate("compensation-treatment").ready} errors={gate("compensation-treatment").errors}>
        <p style={helper}>Record the reviewed jurisdiction and payroll treatment. This does not calculate U.S. tax.</p>
        <div style={grid}>
          <SelectField label="Housing jurisdiction" value={draft.compensation.housingJurisdiction} onChange={(value) => update("compensation", "housingJurisdiction", value)}>{jurisdictionOptions}</SelectField>
          <SelectField label="Housing payroll treatment" value={draft.compensation.housingTreatment} onChange={(value) => update("compensation", "housingTreatment", value)}>{treatmentOptions}</SelectField>
          <TextField label="Housing evidence reference" value={draft.compensation.housingEvidenceReference} onChange={(value) => update("compensation", "housingEvidenceReference", value)} />
          <SelectField label="Mobility allowance jurisdiction" value={draft.compensation.mobilityJurisdiction} onChange={(value) => update("compensation", "mobilityJurisdiction", value)}>{jurisdictionOptions}</SelectField>
          <SelectField label="Mobility allowance payroll treatment" value={draft.compensation.mobilityTreatment} onChange={(value) => update("compensation", "mobilityTreatment", value)}>{treatmentOptions}</SelectField>
          <TextField label="Mobility allowance evidence reference" value={draft.compensation.mobilityEvidenceReference} onChange={(value) => update("compensation", "mobilityEvidenceReference", value)} />
          <TextField label="Compensation reviewer" value={draft.compensation.reviewedBy} onChange={(value) => update("compensation", "reviewedBy", value)} />
          <DateField label="Compensation review date and time" value={draft.compensation.reviewedAt} onChange={(value) => update("compensation", "reviewedAt", value)} />
        </div>
      </GateSection>

      <GateSection id="resolution-immigration" title="4. Verify immigration and work authorization" owner="Immigration specialist" ready={gate("immigration").ready} errors={gate("immigration").errors}>
        <div style={{ marginBottom: 13, padding: 12, border: "1px solid #c8dbd4", borderRadius: 9, background: "#f3faf7", color: "#395d51", fontSize: 13, lineHeight: 1.45 }}>
          Run evidence, date and expiry checks in the dedicated workspace, then bring the specialist-reviewed references back to this activation gate. <a href="/uat/mobility/aditi-india-us/immigration" style={{ color: "#17634f", fontWeight: 800 }}>Open Immigration Copilot and preflight</a>
        </div>
        <div style={grid}>
          <TextField label="Visa category" value={draft.immigration.visaCategory} onChange={(value) => update("immigration", "visaCategory", value)} placeholder="For example, L-1 or H-1B" />
          <TextField label="Work-authorization evidence reference" value={draft.immigration.workAuthorizationReference} onChange={(value) => update("immigration", "workAuthorizationReference", value)} />
          <TextField label="Immigration reviewer" value={draft.immigration.reviewedBy} onChange={(value) => update("immigration", "reviewedBy", value)} />
          <DateField label="Immigration review date and time" value={draft.immigration.reviewedAt} onChange={(value) => update("immigration", "reviewedAt", value)} />
        </div>
      </GateSection>

      <GateSection id="resolution-social-security" title="5. Document the social-security position" owner="Mobility compliance" ready={gate("social-security").ready} errors={gate("social-security").errors}>
        <div style={grid}>
          <SelectField label="Documented social-security position" value={draft.socialSecurity.position} onChange={(value) => update("socialSecurity", "position", value)}>
            <option value="india-contribution">India contribution position documented</option>
            <option value="us-contribution">U.S. contribution position documented</option>
            <option value="dual-contribution-review-complete">Dual-contribution review completed</option>
            <option value="specialist-exception">Specialist exception documented</option>
          </SelectField>
          <TextField label="Social-security assessment reference" value={draft.socialSecurity.assessmentReference} onChange={(value) => update("socialSecurity", "assessmentReference", value)} />
          <TextField label="Social-security reviewer" value={draft.socialSecurity.reviewedBy} onChange={(value) => update("socialSecurity", "reviewedBy", value)} />
          <DateField label="Social-security review date and time" value={draft.socialSecurity.reviewedAt} onChange={(value) => update("socialSecurity", "reviewedAt", value)} />
        </div>
      </GateSection>

      <section id="resolution-us-tax-engine" style={{ scrollMarginTop: 20, border: "1px solid #edc7bd", borderRadius: 12, padding: 16, background: "#fff4f1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}><div><h3 style={{ margin: 0, fontSize: 18 }}>System gate · U.S. monetary tax engine</h3><p style={{ margin: "6px 0 0", color: "#6f4a42", lineHeight: 1.5 }}>There is intentionally no manual pass control. Federal, state, and local monetary tax must remain blocked until a deterministic, verified engine and test pack are integrated.</p></div><span style={{ padding: "5px 9px", borderRadius: 999, fontSize: 11, fontWeight: 800, background: "#ffe2dc", color: "#9b3528" }}>SYSTEM BLOCKER</span></div>
      </section>
    </div>
  </section>;
}

const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 };
const helper: CSSProperties = { margin: "0 0 12px", color: "#66717b", fontSize: 13 };
const primaryButton: CSSProperties = { border: "1px solid #173b32", background: "#173b32", color: "white", padding: "9px 12px", borderRadius: 8, fontWeight: 800, cursor: "pointer" };
const secondaryButton: CSSProperties = { border: "1px solid #bdc8ce", background: "white", color: "#24313b", padding: "9px 12px", borderRadius: 8, fontWeight: 700, cursor: "pointer" };
const jurisdictionOptions = <>{["India", "United States", "Both"].map((value) => <option value={value} key={value}>{value}</option>)}</>;
const treatmentOptions = <>{[["home-payroll", "Home payroll"], ["host-payroll", "Host payroll"], ["shadow-payroll", "Shadow payroll"], ["mobility-only", "Mobility-only record"]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</>;
