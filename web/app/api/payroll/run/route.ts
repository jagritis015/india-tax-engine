import { NextResponse } from "next/server";
import { runNivaBulkPayrollUat } from "../../../../lib/uat-bulk-payroll";

export const dynamic = "force-dynamic";

export async function POST() {
  const run = runNivaBulkPayrollUat();
  return NextResponse.json(run, {
    headers: {
      "Cache-Control": "no-store",
      "X-Payroll-Calculation-Mode": "founder-uat-karnataka-profile",
    },
  });
}
