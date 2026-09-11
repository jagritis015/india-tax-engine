import { UAT_COMPANY, UAT_EMPLOYEES } from "../../../lib/uat-niva-data";

const cash = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function UatEmployeesPage() {
  const blocked = UAT_EMPLOYEES.filter((employee) => employee.status === "Blocked").length;
  const review = UAT_EMPLOYEES.filter((employee) => employee.status === "Needs review").length;
  const ready = UAT_EMPLOYEES.filter((employee) => employee.status === "Ready").length;

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 56px", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: "#64736f", textTransform: "uppercase" }}>Founder UAT baseline</div>
          <h1 style={{ margin: "6px 0 8px", fontSize: 32 }}>{UAT_COMPANY.name}</h1>
          <p style={{ margin: 0, color: "#64736f" }}>{UAT_COMPANY.period} · synthetic employee master for product testing</p>
        </div>
        <a href="/" style={{ background: "#0b6b52", color: "white", textDecoration: "none", padding: "11px 15px", borderRadius: 10, fontWeight: 700 }}>Back to Payroll OS</a>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, margin: "24px 0" }}>
        {[
          ["Employees", UAT_COMPANY.employeeCount],
          ["Ready", ready],
          ["Needs review", review],
          ["Blocked", blocked],
          ["Gross payroll", cash.format(UAT_COMPANY.grossPayroll)],
          ["Employer cost", cash.format(UAT_COMPANY.employerCost)],
        ].map(([label, value]) => (
          <article key={String(label)} style={{ background: "white", border: "1px solid #dfe6e3", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: "#64736f" }}>{label}</div>
            <strong style={{ display: "block", marginTop: 8, fontSize: 20 }}>{value}</strong>
          </article>
        ))}
      </section>

      <div style={{ padding: 14, borderRadius: 10, background: "#eaf6f1", border: "1px solid #bcd9ce", color: "#1b5949", marginBottom: 16 }}>
        All records on this page are synthetic. Use them for UAT only. Statutory monetary results must come from the verified deterministic payroll engine.
      </div>

      <div style={{ overflowX: "auto", background: "white", border: "1px solid #dfe6e3", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr style={{ background: "#f7faf9" }}>
              {['Employee','Role','Monthly gross','Status'].map((heading) => <th key={heading} style={{ textAlign: "left", padding: 13, borderBottom: "1px solid #dfe6e3", fontSize: 12 }}>{heading}</th>)}
            </tr>
          </thead>
          <tbody>
            {UAT_EMPLOYEES.map((employee) => (
              <tr key={employee.id}>
                <td style={{ padding: 13, borderBottom: "1px solid #edf1f0" }}><strong>{employee.name}</strong><div style={{ color: "#64736f", fontSize: 12, marginTop: 3 }}>{employee.id}</div></td>
                <td style={{ padding: 13, borderBottom: "1px solid #edf1f0" }}>{employee.role}</td>
                <td style={{ padding: 13, borderBottom: "1px solid #edf1f0" }}>{cash.format(employee.gross)}</td>
                <td style={{ padding: 13, borderBottom: "1px solid #edf1f0" }}><strong>{employee.status}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
