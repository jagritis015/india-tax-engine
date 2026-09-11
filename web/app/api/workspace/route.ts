import { NextResponse } from "next/server";
import { getPayrollApplicationService } from "../../../lib/payroll-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("company_id") ?? "acme-labs";
  const period = url.searchParams.get("period") ?? "2026-09";

  if (!/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json(
      { error: "period must use YYYY-MM format" },
      { status: 400 },
    );
  }

  const service = getPayrollApplicationService();
  const snapshot = await service.getWorkspaceSnapshot(companyId, period);

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
      "X-Payroll-Data-Mode": snapshot.source,
    },
  });
}
