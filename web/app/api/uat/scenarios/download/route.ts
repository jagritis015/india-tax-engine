import { SCENARIO_DATASETS, getScenarioDataset } from "@/lib/uat-scenario-pack";

export const dynamic = "force-dynamic";

function csvValue(value: unknown) {
  if (value == null) return "";
  const normalized = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [headers.map(csvValue).join(","), ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(","))].join("\n");
}

export async function GET(request: Request) {
  const dataset = new URL(request.url).searchParams.get("dataset") ?? "";
  if (!SCENARIO_DATASETS.some((item) => item.id === dataset)) {
    return new Response(JSON.stringify({ error: "Unknown dataset." }), { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } });
  }
  const csv = toCsv(getScenarioDataset(dataset));
  return new Response(csv, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dataset}-sep-2026.csv"`,
      "X-UAT-Data-Mode": "synthetic-real-use",
    },
  });
}
