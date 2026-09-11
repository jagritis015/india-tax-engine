"use client";

import { useState } from "react";

const cash = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

type Result = {
  status: "CALCULATED" | "REVIEW_REQUIRED" | "BLOCKED";
  grossSalary?: number;
  projectedSalary?: number | null;
  taxableIncome?: number | null;
  annualTaxLiability?: number | null;
  tds?: number | null;
  employeePf?: number | null;
  professionalTax?: number | null;
  totalDeductions?: number | null;
  netSalary?: number | null;
  reviewReason?: string | null;
  error?: string;
  assumptions?: string[];
};

const initial = {
  employeeId: "NVL-UAT-001",
  employeeName: "UAT Calculation Employee",
  basicSalary: "100000",
  hra: "40000",
  specialAllowance: "60000",
  bonus: "0",
  taxableSalaryYtd: "1000000",
  tdsDeductedYtd: "0",
  pfWages: "15000",
};

export default function UatCalculatorPage() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);

  const set = (name: keyof typeof initial, value: string) => setForm((x) => ({ ...x, [name]: value }));

  async function calculate(event: React.FormEvent) {
    event.preventDefault();
    setRunning(true);
    setResult(null);
    try {
      const response = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId.trim(),
          employeeName: form.employeeName.trim(),
          workState: "Karnataka",
          taxYear: "2026-27",
          payrollMonth: 9,
          taxRegime: "new",
          basicSalary: Number(form.basicSalary),
          hra: Number(form.hra),
          specialAllowance: Number(form.specialAllowance),
          bonus: Number(form.bonus),
          commission: 0,
          otherTaxableEarnings: 0,
          taxableSalaryYtd: Number(form.taxableSalaryYtd),
          tdsDeductedYtd: Number(form.tdsDeductedYtd),
          pfApplicable: true,
          pfWages: Number(form.pfWages),
        }),
      });
      setResult(await response.json());
    } catch {
      setResult({ status: "BLOCKED", error: "The calculation service could not be reached." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={{minHeight:"100vh",background:"#f7f8fa",color:"#17202a",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif"}}>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"32px 20px 64px"}}>
        <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap",marginBottom:24}}>
          <div><div style={{fontSize:13,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#667085"}}>Niva Labs India Pvt Ltd · Founder UAT</div><h1 style={{margin:"6px 0",fontSize:32}}>Functional Payroll Calculator</h1><p style={{margin:0,color:"#667085"}}>Run a deterministic September 2026 payroll calculation for the currently verified UAT subset.</p></div>
          <a href="/" style={{padding:"10px 14px",border:"1px solid #d7dce3",borderRadius:10,color:"#17202a",background:"white",textDecoration:"none",fontWeight:700}}>Back to Payroll OS</a>
        </header>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18,alignItems:"start"}}>
          <form onSubmit={calculate} style={panel}>
            <h2 style={heading}>Payroll inputs</h2>
            <p style={copy}>Supported now: TY 2026-27, September, Karnataka, new regime, standard 12% PF. Other cases must fail closed until parity is added.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
              <Field label="Employee ID" value={form.employeeId} onChange={(v)=>set("employeeId",v)} />
              <Field label="Employee name" value={form.employeeName} onChange={(v)=>set("employeeName",v)} />
              <Field label="Basic salary" type="number" value={form.basicSalary} onChange={(v)=>set("basicSalary",v)} />
              <Field label="HRA" type="number" value={form.hra} onChange={(v)=>set("hra",v)} />
              <Field label="Special allowance" type="number" value={form.specialAllowance} onChange={(v)=>set("specialAllowance",v)} />
              <Field label="Bonus" type="number" value={form.bonus} onChange={(v)=>set("bonus",v)} />
              <Field label="Taxable salary YTD" type="number" value={form.taxableSalaryYtd} onChange={(v)=>set("taxableSalaryYtd",v)} />
              <Field label="TDS deducted YTD" type="number" value={form.tdsDeductedYtd} onChange={(v)=>set("tdsDeductedYtd",v)} />
              <Field label="PF wages" type="number" value={form.pfWages} onChange={(v)=>set("pfWages",v)} />
            </div>
            <button type="submit" disabled={running} style={{marginTop:18,border:0,borderRadius:10,padding:"12px 16px",background:"#176b51",color:"white",fontWeight:800,cursor:"pointer"}}>{running?"Calculating…":"Calculate payroll"}</button>
          </form>

          <section style={panel} aria-live="polite">
            <h2 style={heading}>Calculated output</h2>
            {!result && <p style={copy}>Change the inputs and run the calculation. No monetary result is generated by an LLM.</p>}
            {result?.status === "CALCULATED" && <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
                <Metric label="Gross salary" value={cash.format(result.grossSalary ?? 0)} />
                <Metric label="Projected salary" value={cash.format(result.projectedSalary ?? 0)} />
                <Metric label="Taxable income" value={cash.format(result.taxableIncome ?? 0)} />
                <Metric label="Annual tax liability" value={cash.format(result.annualTaxLiability ?? 0)} />
                <Metric label="September TDS" value={cash.format(result.tds ?? 0)} />
                <Metric label="Employee PF" value={cash.format(result.employeePf ?? 0)} />
                <Metric label="Professional Tax" value={cash.format(result.professionalTax ?? 0)} />
                <Metric label="Total deductions" value={cash.format(result.totalDeductions ?? 0)} />
              </div>
              <div style={{marginTop:12,padding:18,borderRadius:12,background:"#edf8f3"}}><div style={{fontSize:13,color:"#466"}}>Net salary</div><strong style={{fontSize:30}}>{cash.format(result.netSalary ?? 0)}</strong></div>
            </>}
            {result?.status === "REVIEW_REQUIRED" && <div style={{padding:16,borderRadius:12,background:"#fff6df"}}><strong>Review required</strong><p style={{margin:"8px 0 0"}}>{result.reviewReason}</p></div>}
            {result?.status === "BLOCKED" && <div style={{padding:16,borderRadius:12,background:"#fff0f0"}}><strong>Calculation blocked</strong><p style={{margin:"8px 0 0"}}>{result.error}</p></div>}
            {result?.assumptions && <details style={{marginTop:16}}><summary style={{fontWeight:700,cursor:"pointer"}}>Calculation scope and assumptions</summary><ul style={{paddingLeft:20,lineHeight:1.6,color:"#667085"}}>{result.assumptions.map((x)=><li key={x}>{x}</li>)}</ul></details>}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({label,value,onChange,type="text"}:{label:string;value:string;onChange:(value:string)=>void;type?:string}) {
  return <label style={{fontSize:13,fontWeight:700,minWidth:0}}>{label}<input required min={type==="number"?0:undefined} step={type==="number"?1:undefined} type={type} value={value} onChange={(e)=>onChange(e.target.value)} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:"11px 12px",border:"1px solid #d7dce3",borderRadius:9,fontSize:16,background:"white"}}/></label>;
}
function Metric({label,value}:{label:string;value:string}) { return <div style={{padding:13,border:"1px solid #e2e6eb",borderRadius:10,background:"#fff"}}><div style={{fontSize:12,color:"#667085"}}>{label}</div><strong style={{display:"block",marginTop:4,fontSize:18}}>{value}</strong></div>; }
const panel = {background:"white",border:"1px solid #e2e6eb",borderRadius:14,padding:20,boxShadow:"0 1px 2px rgba(15,23,42,.03)"} as const;
const heading = {margin:"0 0 8px",fontSize:21} as const;
const copy = {margin:"0 0 18px",color:"#667085",lineHeight:1.55} as const;
