import Link from "next/link";
import { buildAditiIndiaUsCaseSummary } from "@/lib/uat-mobility-case-summary";
import { inspectHostStateEvidencePersistenceReadiness, resolveHostStateEvidencePersistenceRuntimeState } from "@/lib/uat-host-state-evidence-verification-service";

function readinessExplanation(reason: string): string {
  switch (reason) {
    case "STORAGE_NOT_APPROVED": return "Durable verification storage has not been explicitly approved for this runtime.";
    case "DURABLE_BINDING_ABSENT": return "Approved storage is configured, but no durable runtime binding is present.";
    case "BINDING_NAME_MISSING": return "A durable binding is present, but its approved binding name is missing.";
    case "READY": return "The runtime reports an approved durable binding. Verification writes still remain inactive in UAT.";
    default: return "Persistence readiness could not be determined. Verification writes remain inactive.";
  }
}

export default function HostStateEvidencePage() {
  const summary = buildAditiIndiaUsCaseSummary();
  const evidence = summary.hostStateEvidence;
  const runtime = resolveHostStateEvidencePersistenceRuntimeState(process.env);
  const persistenceReadiness = inspectHostStateEvidencePersistenceReadiness(runtime);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">India to United States mobility</p>
          <h1 className="text-3xl font-semibold tracking-tight">US host-state evidence</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">This is the authoritative evidence requirement for case {summary.caseId}. Scenario host-state inputs elsewhere do not update this record.</p>
        </div>
        <Link className="text-sm font-medium underline underline-offset-4" href="/uat/mobility/aditi-india-us">Back to unified case</Link>
      </div>

      <section className="rounded-xl border p-6">
        <div className="grid gap-5 md:grid-cols-4">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verification status</p><p className="mt-1 text-lg font-semibold">{evidence.status}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence verified</p><p className="mt-1 text-lg font-semibold">{evidence.verifiedEvidenceItems} of {evidence.totalEvidenceItems}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Authoritative host state</p><p className="mt-1 text-lg font-semibold">{evidence.authoritativeState ?? "Not established"}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">State tax assessment</p><p className="mt-1 text-lg font-semibold">{evidence.stateTaxAssessmentAllowed ? "Allowed" : "Blocked"}</p></div>
        </div>

        <div className="mt-6 rounded-lg border p-4 text-sm">
          <p className="font-semibold">Authority review</p>
          <p className="mt-1 text-muted-foreground">Read-only controlled-review state from the authoritative case summary. This screen cannot approve or mutate host-state authority.</p>
          <dl className="mt-4 grid gap-3 md:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review status</dt><dd className="mt-1 font-medium">{evidence.authorityReviewStatus}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Candidate state</dt><dd className="mt-1 font-medium">{evidence.candidateState ?? "Not nominated"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Authoritative state</dt><dd className="mt-1 font-medium">{evidence.authoritativeState ?? "Not established"}</dd></div>
          </dl>
          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Approval provenance</p>
          <dl className="mt-3 grid gap-3 md:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reviewed by</dt><dd className="mt-1 font-medium">{evidence.reviewedBy ?? "Not recorded"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reviewed at</dt><dd className="mt-1 font-medium">{evidence.reviewedAt ?? "Not recorded"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Approval reference</dt><dd className="mt-1 font-medium">{evidence.approvalReference ?? "Not recorded"}</dd></div>
          </dl>
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Why this gate is blocked</p><p className="mt-1">{evidence.blockingReason}</p>
          <p className="mt-4 font-semibold">Next safe action</p><p className="mt-1">{evidence.nextAction}</p>
        </div>

        <div className="mt-6 rounded-lg border p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">Verification persistence readiness</p><p className="mt-1 text-muted-foreground">Read-only runtime diagnostic. It does not activate verification writes or state tax calculation.</p></div><span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">{persistenceReadiness.ready ? "Runtime ready" : "Fail closed"}</span></div>
          <dl className="mt-4 grid gap-3 md:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reason</dt><dd className="mt-1 font-medium">{persistenceReadiness.reason}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Binding</dt><dd className="mt-1 font-medium">{persistenceReadiness.bindingName ?? "Not available"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Writes activated</dt><dd className="mt-1 font-medium">No</dd></div>
          </dl>
          <p className="mt-4 text-muted-foreground">{readinessExplanation(persistenceReadiness.reason)}</p>
        </div>

        <div className="mt-6 border-t pt-6">
          <h2 className="text-lg font-semibold">Evidence checklist</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every required item must be verified before an authoritative host state can be established.</p>
          <p className="mt-2 text-xs text-muted-foreground">Audit rule: {evidence.verificationPolicy}</p>
          <ul className="mt-4 space-y-3">{evidence.evidenceItems.map((item) => (<li className="rounded-lg border p-4" key={item.id}><div className="flex items-start justify-between gap-4"><span className="text-sm">{item.label}</span><span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.status}</span></div><div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3"><span>Source reference: {item.evidenceReference ?? "Not recorded"}</span><span>Verified by: {item.verifiedBy ?? "Not recorded"}</span><span>Verified at: {item.verifiedAt ?? "Not recorded"}</span></div></li>))}</ul>
        </div>

        <div className="mt-6 rounded-lg bg-muted p-4 text-sm"><p className="font-medium">Fail-closed rule</p><p className="mt-1 text-muted-foreground">Until the host state is verified from case evidence, state and local tax scope must not be inferred, monetary US tax must not be calculated, and payroll activation remains subject to the unified readiness gates.</p></div>
      </section>
    </main>
  );
}
