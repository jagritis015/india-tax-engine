import Link from "next/link";

const build = {
  commit: "3529b3ad",
  fullCommit: "3529b3ad289b4b02fa44e1b0c145c1b753ba9a19",
  ci: "Passed",
  ciRun: "#48",
  updated: "11 Sep 2026",
  source: "GitHub main",
};

const statutoryCoverage = [
  { area: "Annual income tax", status: "Verified", note: "Tax-year aware statutory gate" },
  { area: "Salary TDS", status: "Verified", note: "Section 392 production gate" },
  { area: "HRA exemption", status: "Verified", note: "Rule 279 with new-regime exclusion" },
  { area: "Standard deduction", status: "Verified", note: "Section 19 salary deduction" },
  { area: "Professional Tax salary deduction", status: "Verified", note: "Section 19 / section 202 treatment" },
  { area: "Schedule XV aggregate deduction", status: "Verified", note: "Aggregate cap and regime gate; qualifying instruments must be validated upstream" },
  { area: "Health-insurance deduction", status: "Verified", note: "Structured Section 126 model; legacy aggregate 80D input fails closed" },
  { area: "PF / state Professional Tax coverage", status: "Audit ongoing", note: "Rule-by-rule production-completeness audit still required" },
];

const productReadiness = [
  { label: "Repository CI", value: "Green", detail: "Python 3.11, Python 3.12 and Payroll workspace" },
  { label: "Statutory salary chain", value: "Gated", detail: "Unsupported or ambiguous inputs fail closed" },
  { label: "Live deployment trace", value: "In progress", detail: "OpenAI Sites project is identified; deployed commit still needs runtime verification" },
  { label: "Real-company UAT", value: "Not approved", detail: "Use representative data until security and deployment gates are validated" },
];

export default function StatusPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f7f8fa", color: "#17202a", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px 64px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#687385" }}>India Payroll OS</div>
            <h1 style={{ margin: "6px 0 4px", fontSize: 32 }}>Build, Accuracy & UAT Status</h1>
            <p style={{ margin: 0, color: "#687385" }}>This page describes the build represented by the repository. Live deployment identity is shown separately until the Sites runtime can prove its deployed commit.</p>
          </div>
          <Link href="/" style={{ textDecoration: "none", padding: "10px 14px", border: "1px solid #d7dce3", borderRadius: 10, color: "#17202a", fontWeight: 600, background: "white" }}>Back to Payroll OS</Link>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginBottom: 24 }}>
          <Card label="Repository commit" value={build.commit} detail={build.source} />
          <Card label="CI" value={`${build.ci} ${build.ciRun}`} detail="Latest statutory closure regression" />
          <Card label="Accuracy gate" value="Controlled" detail="Salary-chain statutory gates landed" />
          <Card label="Deployment" value="Needs runtime proof" detail="Do not assume GitHub main equals the live site" />
        </section>

        <section style={panelStyle}>
          <h2 style={headingStyle}>Current product readiness</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {productReadiness.map((item) => (
              <div key={item.label} style={rowStyle}>
                <div><strong>{item.label}</strong><div style={noteStyle}>{item.detail}</div></div>
                <span style={badgeStyle(item.value === "Green" || item.value === "Gated")}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={headingStyle}>Statutory coverage snapshot</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {statutoryCoverage.map((item) => (
              <div key={item.area} style={rowStyle}>
                <div><strong>{item.area}</strong><div style={noteStyle}>{item.note}</div></div>
                <span style={badgeStyle(item.status === "Verified")}>{item.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, border: "1px solid #efc66b", background: "#fffaf0" }}>
          <h2 style={{ ...headingStyle, marginBottom: 8 }}>UAT safety boundary</h2>
          <p style={{ margin: 0, lineHeight: 1.6 }}>This remains a representative UAT product. Do not upload confidential employer payroll data until tenant isolation, access controls, retention, audit controls and the live deployment identity are explicitly validated. Unsupported statutory inputs must remain visible and fail closed.</p>
        </section>

        <footer style={{ marginTop: 24, color: "#7a8493", fontSize: 13 }}>Repository status updated {build.updated}. Full commit: <code>{build.fullCommit}</code></footer>
      </div>
    </main>
  );
}

function Card({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article style={{ ...panelStyle, marginBottom: 0 }}><div style={{ fontSize: 13, color: "#687385", marginBottom: 9 }}>{label}</div><strong style={{ fontSize: 21 }}>{value}</strong><div style={{ ...noteStyle, marginTop: 7 }}>{detail}</div></article>;
}

const panelStyle = { background: "white", border: "1px solid #e2e6eb", borderRadius: 14, padding: 20, marginBottom: 18, boxShadow: "0 1px 2px rgba(15,23,42,.03)" } as const;
const headingStyle = { fontSize: 20, margin: "0 0 16px" } as const;
const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "13px 0", borderBottom: "1px solid #edf0f3" } as const;
const noteStyle = { color: "#687385", fontSize: 13, marginTop: 4, lineHeight: 1.45 } as const;
const badgeStyle = (positive: boolean) => ({ whiteSpace: "nowrap" as const, borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700, background: positive ? "#ecf8f0" : "#fff4dc", color: positive ? "#257443" : "#8a5a00" });
