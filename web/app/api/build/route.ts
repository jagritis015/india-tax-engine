const expectedCommit = "f5883be7b53add7bef8f351e61e0bb7c09d85c23";

export async function GET() {
  return Response.json(
    {
      service: "india-payroll-os",
      environment: "uat",
      expectedCommit,
      expectedShortCommit: expectedCommit.slice(0, 8),
      baseline: {
        company: "Niva Labs India Pvt Ltd",
        employees: 100,
        period: "2026-09",
      },
      note: "This endpoint identifies the repository build intended for the live UAT Site. Publication must still be verified at runtime.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
