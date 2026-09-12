import { NextResponse } from "next/server";
import { assessAditiIndiaUsReadiness } from "../../../../../lib/uat-mobility-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(assessAditiIndiaUsReadiness(), {
    headers: {
      "Cache-Control": "no-store",
      "X-Mobility-Control-Mode": "deterministic-fail-closed-uat",
    },
  });
}
