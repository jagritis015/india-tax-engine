import { NextResponse } from "next/server";
import {
  calculateSupportedUatPayroll,
  type UatPayrollCalculationInput,
} from "../../../../lib/uat-payroll-calculator";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UatPayrollCalculationInput;
    const result = calculateSupportedUatPayroll(body);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-Payroll-Calculation-Mode": "uat-verified-subset",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "BLOCKED",
        error: error instanceof Error ? error.message : "Invalid payroll calculation input",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
