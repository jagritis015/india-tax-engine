import { NextResponse } from "next/server";
import { calculateIndiaHypotheticalTax } from "../../../../lib/uat-india-hypothetical-tax";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = calculateIndiaHypotheticalTax({
      employeeId: String(body.employeeId ?? ""),
      employeeName: String(body.employeeName ?? ""),
      monthlyStayAtHomeGross: Number(body.monthlyStayAtHomeGross),
      taxableSalaryYtd: Number(body.taxableSalaryYtd),
      tdsDeductedYtd: Number(body.tdsDeductedYtd),
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "REVIEW_REQUIRED",
        reviewReason: error instanceof Error ? error.message : "Invalid hypothetical-tax input.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
