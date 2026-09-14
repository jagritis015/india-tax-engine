import { NextResponse } from "next/server";
import {
  inspectHostStateEvidencePersistenceReadiness,
  resolveHostStateEvidencePersistenceRuntimeState,
} from "../../../../../../lib/uat-host-state-evidence-verification-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = resolveHostStateEvidencePersistenceRuntimeState(process.env);
  const readiness = inspectHostStateEvidencePersistenceReadiness(runtime);

  return NextResponse.json(
    {
      ...readiness,
      writesActivated: false,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Mobility-Control-Mode": "deterministic-fail-closed-uat",
      },
    },
  );
}
