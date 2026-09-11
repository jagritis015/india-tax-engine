import { UAT_COMPANY, UAT_EMPLOYEES } from "../../../lib/uat-niva-data";

export async function GET() {
  return Response.json(
    {
      company: UAT_COMPANY,
      employees: UAT_EMPLOYEES,
      source: "representative-uat",
      privacy: "synthetic-only",
      note: "No real employee PII. Statutory monetary outputs remain server-deterministic-only.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Payroll-Data-Mode": "representative-uat",
      },
    },
  );
}
