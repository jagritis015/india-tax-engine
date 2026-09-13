import Link from "next/link";
import { buildAditiIndiaUsCaseSummary } from "@/lib/uat-mobility-case-summary";

export default function HostStateEvidencePage() {
  const summary = buildAditiIndiaUsCaseSummary();
  const evidence = summary.hostStateEvidence;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">India to United States mobility</p>
          <h1 className="text-3xl font-semibold tracking-tight">US host-state evidence</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            This is the authoritative evidence requirement for case {summary.caseId}. Scenario host-state inputs elsewhere do not update this record.
          </p>
        </div>
        <Link className="text-sm font-medium underline underline-offset-4" href="/uat/mobility/aditi-india-us">
          Back to unified case
        </Link>
      </div>

      <section className="rounded-xl border p-6">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verification status</p>
            <p className="mt-1 text-lg font-semibold">{evidence.status}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Authoritative host state</p>
            <p className="mt-1 text-lg font-semibold">Not established</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">State tax assessment</p>
            <p className="mt-1 text-lg font-semibold">Blocked</p>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h2 className="text-lg font-semibold">Evidence required before verification</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {evidence.requiredEvidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium">Fail-closed rule</p>
          <p className="mt-1 text-muted-foreground">
            Until the host state is verified from case evidence, state and local tax scope must not be inferred, monetary US tax must not be calculated, and payroll activation remains subject to the unified readiness gates.
          </p>
        </div>
      </section>
    </main>
  );
}
