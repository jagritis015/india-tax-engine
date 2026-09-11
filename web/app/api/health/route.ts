import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    service: "india-payroll-os",
    status: "ok",
    environment: "uat",
    ai: {
      providerMode: "disabled-until-approved",
      paidApiEnabled: false,
    },
    payroll: {
      statutoryArithmetic: "python-deterministic-engine",
      browserArithmeticAllowed: false,
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
