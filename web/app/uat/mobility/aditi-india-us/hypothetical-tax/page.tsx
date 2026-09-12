"use client";

import { useState } from "react";

const cash = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

type Result = {
  status: "CALCULATED" | "REVIEW_REQUIRED";
  policyVersion?: string;
  projectedStayAtHomeSalary?: number | null;
  hypotheticalTaxableIncome?: number | null;
  hypotheticalAnnualIndiaTax?: number | null;
  hypotheticalMonthlyWithholding?: number | null;
  reviewReason?: string | null;
  policyAssumptions?: string[];
};

export default function IndiaHypotheticalTaxPage() {
  const [gross, setGross] = useState(156000);
  const [ytdSalary, setYtdSalary] = useState(780000);
  const [ytdTds, setYtdTds] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);

  async function calculate() {
    setRunning(true);
    try {
      const response = await fetch("/api/mobility/india-hypothetical-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: "NVL-017",
          employeeName: "Aditi Joshi",
          monthlyStayAtHomeGross: gross,
          taxableSalaryYtd: ytdSalary,
          tdsDeductedYtd: ytdTds,
        }),
      });
      const body = await response.json();
      setResult(body);
    } finally {
      setRunning(false);
    }
  }

  return <main style={{minHeight:"100vh",background:"#f6f8fa",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif",color:"#18212b"}}>
    <div style={{maxWidth:1060,margin:"0 auto",padding:"28px 18px 64px"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
        <div><div style={{fontSize:13,color:"#6b7480",marginBottom:6}}>India → U.S. mobility · Tax equalization UAT</div><h1 style={{margin:"0 0 8px",fontSize:32}}>Aditi Joshi · India hypothetical tax</h1><p style={{margin:0,color:"#5d6772",maxWidth:760}}>Calculate the policy-defined stay-at-home India tax using the same deterministic India calculation path that powers payroll. Assignment allowances are excluded from this UAT hypothetical-tax policy.</p></div>
        <a href="/uat/mobility/aditi-india-us" style={{textDecoration:"none",color:"inherit",border:"1px solid #cfd6dc",background:"white",padding:"10px 13px",borderRadius:9}}>Back to mobility case</a>
      </header>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18,marginBottom:18}}>
        <h2 style={{marginTop:0}}>Stay-at-home compensation</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          <label><small>Monthly India gross</small><input type="number" min="0" value={gross} onChange={e=>setGross(Number(e.target.value))} style={input}/></label>
          <label><small>Taxable salary YTD</small><input type="number" min="0" value={ytdSalary} onChange={e=>setYtdSalary(Number(e.target.value))} style={input}/></label>
          <label><small>TDS deducted YTD</small><input type="number" min="0" value={ytdTds} onChange={e=>setYtdTds(Number(e.target.value))} style={input}/></label>
        </div>
        <div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}><button onClick={calculate} disabled={running} style={{border:0,borderRadius:9,padding:"11px 16px",fontWeight:700,background:"#236b52",color:"white",cursor:"pointer"}}>{running?"Calculating…":"Calculate hypothetical tax"}</button></div>
      </section>

      {!result && <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:22,textAlign:"center",color:"#68727c"}}>Run the calculation to see Aditi's policy-defined hypothetical India tax.</section>}

      {result && <>
        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginBottom:18}}>
          {[
            ["Status",result.status.replaceAll("_"," ")],
            ["Projected stay-at-home salary",result.projectedStayAtHomeSalary==null?"Review required":cash.format(result.projectedStayAtHomeSalary)],
            ["Hypothetical taxable income",result.hypotheticalTaxableIncome==null?"Review required":cash.format(result.hypotheticalTaxableIncome)],
            ["Hypothetical annual India tax",result.hypotheticalAnnualIndiaTax==null?"Review required":cash.format(result.hypotheticalAnnualIndiaTax)],
            ["Monthly hypothetical withholding",result.hypotheticalMonthlyWithholding==null?"Review required":cash.format(result.hypotheticalMonthlyWithholding)],
            ["Policy version",result.policyVersion ?? "Unavailable"],
          ].map(([label,value])=><article key={label} style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:15}}><div style={{fontSize:12,color:"#737d87"}}>{label}</div><strong style={{display:"block",marginTop:5}}>{value}</strong></article>)}
        </section>

        {result.reviewReason && <section style={{background:"#fff7e8",border:"1px solid #ead5aa",borderRadius:12,padding:16,marginBottom:18}}><strong>Review required</strong><div style={{marginTop:6}}>{result.reviewReason}</div></section>}

        <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18}}>
          <h2 style={{marginTop:0}}>Policy assumptions</h2>
          <ul style={{marginBottom:0,color:"#5f6872"}}>{(result.policyAssumptions ?? []).map(item=><li key={item} style={{marginTop:7}}>{item}</li>)}</ul>
          <p style={{fontSize:12,color:"#737d87",marginBottom:0}}>This is a mobility-policy hypothetical tax for UAT. It is not actual India tax due, U.S. tax due, or a filed tax position.</p>
        </section>
      </>}
    </div>
  </main>;
}

const input: React.CSSProperties = {width:"100%",boxSizing:"border-box",marginTop:6,padding:"10px 11px",border:"1px solid #cfd6dc",borderRadius:8,fontSize:15,background:"white"};
