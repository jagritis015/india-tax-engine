const releaseId = "niva-uat-2026-09-11";
const sourceBaselineCommit = "620024c056b17401275e45f77c913a2959432e9b";

export async function GET() {
  const runtimeCommit =
    process.env.GITHUB_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.COMMIT_SHA ??
    null;

  return Response.json(
    {
      service: "india-payroll-os",
      environment: "uat",
      releaseId,
      sourceBaselineCommit,
      runtimeCommit,
      baseline: {
        companyId: "niva-labs-in",
        company: "Niva Labs India Pvt Ltd",
        employees: 100,
        period: "2026-09",
      },
      verification: {
        releaseIdentity: "stable",
        runtimeCommitAvailable: runtimeCommit !== null,
        rule: "Treat the Site as current when this releaseId and Niva Labs baseline are visible. Compare runtimeCommit when the host exposes one.",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
