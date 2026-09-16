import { NextResponse } from "next/server";
import { SCENARIO_CATALOG, SCENARIO_DATASETS, runScenario, type ScenarioId } from "@/lib/uat-scenario-pack";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    company: "Niva Labs India Pvt Ltd",
    period: "September 2026",
    scenarios: SCENARIO_CATALOG,
    datasets: SCENARIO_DATASETS,
    workbook: "/uat-scenarios/india-payroll-os-real-use-uat-pack.xlsx",
    mode: "synthetic-real-use-uat",
  }, { headers: { "Cache-Control": "no-store", "X-UAT-Scenario-Mode": "deterministic-reconciliation" } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { scenarioId?: string };
    const scenario = SCENARIO_CATALOG.find((item) => item.id === body.scenarioId);
    if (!scenario) return NextResponse.json({ error: "Unknown scenario ID." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(runScenario(scenario.id as ScenarioId), {
      headers: { "Cache-Control": "no-store", "X-UAT-Scenario-Mode": "deterministic-reconciliation" },
    });
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
