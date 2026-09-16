import { INDIA_PAYROLL_COMPONENTS, NIVA_GLOBAL_TECH_TEMPLATE, calculateFromComponents } from "@/lib/india-payroll-components";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };

export async function GET() {
  return new Response(JSON.stringify({ company: "Niva Global Technologies India Pvt Ltd", catalogVersion: "india-components-v1", components: INDIA_PAYROLL_COMPONENTS, template: NIVA_GLOBAL_TECH_TEMPLATE }), { headers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || !body.values || typeof body.values !== "object") throw new Error("Component values are required");
    const numeric = ["taxableSalaryYtd", "tdsDeductedYtd", "pfWages"];
    for (const field of numeric) if (!Number.isSafeInteger(body[field]) || body[field] < 0) throw new Error(`${field} must be a non-negative whole-rupee amount`);
    const allowed = new Set(["BASIC","HRA","SPL_ALLOW","PERF_BONUS","SALES_COMM"]);
    const values: Record<string, number> = {};
    for (const [code, amount] of Object.entries(body.values)) {
      if (!allowed.has(code)) throw new Error(`${code} is not enabled for deterministic calculation in this UAT version`);
      if (!Number.isSafeInteger(amount) || Number(amount) < 0) throw new Error(`${code} must be a non-negative whole-rupee amount`);
      values[code] = Number(amount);
    }
    return new Response(JSON.stringify(calculateFromComponents({ employeeId: String(body.employeeId || "UAT-COMP-001"), employeeName: String(body.employeeName || "Component UAT Employee"), values, taxableSalaryYtd: body.taxableSalaryYtd, tdsDeductedYtd: body.tdsDeductedYtd, pfWages: body.pfWages })), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ status: "BLOCKED", error: error instanceof Error ? error.message : "Invalid component calculation request" }), { status: 400, headers });
  }
}
