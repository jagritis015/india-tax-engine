import { NextResponse } from "next/server";
import { buildAditiIndiaUsCaseSummary } from "../../../../../lib/uat-mobility-case-summary";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildAditiIndiaUsCaseSummary(), {
    headers: {
      "Cache-Control": "no-store",
      "X-Mobility-Case-Mode": "deterministic-fail-closed-uat",
    },
  });
}
