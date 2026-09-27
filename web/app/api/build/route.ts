function runtimeCommit() {
  return (
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    null
  );
}

export async function GET() {
  const deployedCommit = runtimeCommit();

  return Response.json(
    {
      service: "india-payroll-os",
      environment: "uat",
      deployedCommit,
      deployedShortCommit: deployedCommit?.slice(0, 8) ?? null,
      baseline: {
        company: "Niva Labs India Pvt Ltd",
        employees: 100,
        period: "2026-09",
      },
      verified: false,
      note:
        "Runtime commit metadata identifies the deployed build when the hosting platform exposes it. Canonical Site deployment and smoke testing must be verified independently.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
