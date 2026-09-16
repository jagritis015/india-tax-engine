"use client";

import { useMemo, useState } from "react";
import { INDIA_PAYROLL_COMPONENTS, NIVA_GLOBAL_TECH_TEMPLATE, type PayrollComponentCategory } from "@/lib/india-payroll-components";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const categories = ["All", ...Array.from(new Set(INDIA_PAYROLL_COMPONENTS.map((item) => item.category)))] as Array<"All" | PayrollComponentCategory>;
const initialValues = { BASIC: "100000", HRA: "40000", SPL_ALLOW: "60000", PERF_BONUS: "0", SALES_COMM: "0" };

type Calculation = { status?: string; error?: string; inputComponents?: Array<{code:string;amount:number}>; calculatedComponents?: Array<{code:string;amount:number|null}>; result?: {status:string;grossSalary:number;tds:number;employeePf:number;professionalTax:number;totalDeductions:number;netSalary:number;reviewReason?:string} };

export default function PayrollComponentsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedCode, setSelectedCode] = useState("BASIC");
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState<Calculation | null>(null);
  const [running, setRunning] = useState(false);
  const selected = INDIA_PAYROLL_COMPONENTS.find((item) => item.code === selectedCode) ?? INDIA_PAYROLL_COMPONENTS[0];
  const filtered = useMemo(() => INDIA_PAYROLL_COMPONENTS.filter((item) => {
    const text = `${item.code} ${item.name} ${item.payslipName}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === "All" || item.category === category) && (!activeOnly || item.active);
  }), [query, category, activeOnly]);

  async function calculate() {
    setRunning(true); setResult(null);
    try {
      const response = await fetch("/api/payroll/components", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeId: "NVL-UAT-001", employeeName: "Aarav Mehta", values: Object.fromEntries(Object.entries(values).map(([code, amount]) => [code, Number(amount)])), taxableSalaryYtd: 1_000_000, tdsDeductedYtd: 0, pfWages: 15_000 }) });
      setResult(await response.json());
    } catch { setResult({ status: "BLOCKED", error: "The calculation service could not be reached." }); }
    finally { setRunning(false); }
  }

  function download() {
    const headers = ["Code","Component","Category","Pay type","Calculation","CTC","Gross","Cash","Taxable","PF treatment","ESI treatment","Prorated","Active","Engine status"];
    const rows = INDIA_PAYROLL_COMPONENTS.map((x) => [x.code,x.name,x.category,x.payType,x.calculation,x.ctc,x.gross,x.cash,x.taxable,x.pfTreatment,x.esiTreatment,x.prorated,x.active,x.engineStatus]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
    const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"})); anchor.download = "india-payroll-component-catalog-v1.csv"; anchor.click(); URL.revokeObjectURL(anchor.href);
  }

  return <main style={shell}><div style={{maxWidth:1320,margin:"0 auto",padding:"28px 20px 64px"}}>
    <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
      <div><div style={eyebrow}>Niva Global Technologies India Pvt Ltd</div><h1 style={{margin:"6px 0",fontSize:32}}>India payroll component catalogue</h1><p style={{margin:0,color:"#5e6973",maxWidth:760,lineHeight:1.55}}>One governed library for salary structure, monthly inputs, statutory calculation, payslips and accounting mapping.</p></div>
      <div style={{display:"flex",gap:9,flexWrap:"wrap"}}><button style={secondary} onClick={download}>Download catalogue CSV</button><a href="/" style={{...secondary,textDecoration:"none"}}>Back to Payroll OS</a></div>
    </header>

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:18}}>
      <Metric label="Catalogue version" value="India v1"/><Metric label="Components" value={String(INDIA_PAYROLL_COMPONENTS.length)}/><Metric label="Active in template" value={String(NIVA_GLOBAL_TECH_TEMPLATE.componentCodes.length)}/><Metric label="Calculated now" value={String(INDIA_PAYROLL_COMPONENTS.filter((x)=>x.engineStatus==="Calculated").length)}/>
    </section>

    <section style={{...panel,marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}><div><div style={eyebrow}>Salary template</div><h2 style={heading}>{NIVA_GLOBAL_TECH_TEMPLATE.name}</h2><p style={copy}>Effective 1 April 2026. The template determines which governed components can be assigned to an employee. It does not replace the employee&apos;s actual amounts.</p></div><span style={versionPill}>VERSIONED IN GITHUB</span></div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{NIVA_GLOBAL_TECH_TEMPLATE.componentCodes.map((code)=><button key={code} onClick={()=>setSelectedCode(code)} style={{...chip,background:selectedCode===code?"#173b32":"#f3f6f5",color:selectedCode===code?"white":"#26332e"}}>{code}</button>)}</div>
    </section>

    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.6fr) minmax(300px,.8fr)",gap:18,alignItems:"start"}}>
      <section style={panel}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:14}}><div><div style={eyebrow}>Component master</div><h2 style={heading}>Search and inspect mappings</h2></div><label style={{fontSize:14,display:"flex",gap:7,alignItems:"center"}}><input type="checkbox" checked={activeOnly} onChange={(e)=>setActiveOnly(e.target.checked)}/> Active template only</label></div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(190px,.5fr)",gap:10,marginBottom:14}}><input aria-label="Search components" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search code or component" style={input}/><select aria-label="Filter category" value={category} onChange={(e)=>setCategory(e.target.value as (typeof categories)[number])} style={input}>{categories.map((item)=><option key={item}>{item}</option>)}</select></div>
        <div style={{overflowX:"auto",border:"1px solid #e1e6e4",borderRadius:10}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:760}}><thead><tr>{["Code","Component","Category","Pay type","Tax","Status"].map((label)=><th key={label} style={th}>{label}</th>)}</tr></thead><tbody>{filtered.map((item)=><tr key={item.code} onClick={()=>setSelectedCode(item.code)} style={{cursor:"pointer",background:selectedCode===item.code?"#edf6f2":"white"}}><td style={td}><strong>{item.code}</strong></td><td style={td}><strong>{item.name}</strong><small style={{display:"block",color:"#6a756f",marginTop:3}}>Payslip: {item.payslipName}</small></td><td style={td}>{item.category}</td><td style={td}>{item.payType}</td><td style={td}>{item.taxable}</td><td style={td}><span style={{...status,background:item.engineStatus==="Calculated"?"#dff3e7":item.engineStatus==="Input"?"#e8eef8":"#f1f2f3",color:item.engineStatus==="Calculated"?"#246a4c":"#4c5861"}}>{item.engineStatus}</span></td></tr>)}</tbody></table>{!filtered.length&&<div style={{padding:24,textAlign:"center",color:"#667085"}}>No components match these filters.</div>}</div>
      </section>

      <aside style={{display:"grid",gap:18}}>
        <section style={panel}><div style={eyebrow}>Selected component</div><h2 style={{...heading,marginTop:6}}>{selected.name}</h2><div style={{fontFamily:"monospace",fontSize:14,color:"#315b50",marginBottom:14}}>{selected.code}</div><Detail label="Payslip label" value={selected.payslipName}/><Detail label="Calculation" value={selected.calculation}/><Detail label="CTC / Gross / Cash" value={`${yes(selected.ctc)} / ${yes(selected.gross)} / ${yes(selected.cash)}`}/><Detail label="Tax treatment" value={selected.taxable}/><Detail label="PF treatment" value={selected.pfTreatment}/><Detail label="ESI treatment" value={selected.esiTreatment}/><Detail label="Prorated" value={yes(selected.prorated)}/><Detail label="Template status" value={NIVA_GLOBAL_TECH_TEMPLATE.componentCodes.includes(selected.code)?"Included":"Available but inactive"}/></section>
      </aside>
    </div>

    <section style={{...panel,marginTop:18}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}><div><div style={eyebrow}>Live mapping test</div><h2 style={heading}>Calculate payroll from component codes</h2><p style={copy}>These five component values are mapped into the existing deterministic September Karnataka payroll engine. The result returns statutory component codes for TDS, employee PF and PT.</p></div><span style={versionPill}>NO AI ARITHMETIC</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>{Object.entries(values).map(([code,amount])=><label key={code} style={{fontSize:13,fontWeight:700}}>{code}<input type="number" min="0" step="1" value={amount} onChange={(e)=>setValues((current)=>({...current,[code]:e.target.value}))} style={input}/></label>)}</div>
      <button onClick={calculate} disabled={running} style={{...primary,marginTop:14}}>{running?"Calculating":"Run component calculation"}</button>
      {result?.result?.status==="CALCULATED"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginTop:16}}><Metric label="Gross" value={money.format(result.result.grossSalary)}/><Metric label="TDS" value={money.format(result.result.tds)}/><Metric label="Employee PF" value={money.format(result.result.employeePf)}/><Metric label="Karnataka PT" value={money.format(result.result.professionalTax)}/><Metric label="Total deductions" value={money.format(result.result.totalDeductions)}/><Metric label="Net salary" value={money.format(result.result.netSalary)}/></div>}
      {(result?.error||result?.result?.status==="REVIEW_REQUIRED")&&<div style={{marginTop:14,padding:13,borderRadius:9,background:"#fff3d8",color:"#7a5000"}}><strong>Calculation stopped for review.</strong> {result.error??result.result?.reviewReason}</div>}
    </section>

    <p style={{fontSize:13,color:"#667085",marginTop:16,lineHeight:1.5}}>UAT scope: catalogue definitions are versioned system configuration. Components marked Reference only are visible for design review but cannot produce money until their deterministic rules are implemented and verified.</p>
  </div></main>;
}

const yes = (value:boolean) => value ? "Yes" : "No";
function Metric({label,value}:{label:string;value:string}) { return <article style={{background:"white",border:"1px solid #e1e6e4",borderRadius:11,padding:14}}><small style={{color:"#69756f"}}>{label}</small><strong style={{display:"block",fontSize:20,marginTop:4}}>{value}</strong></article>; }
function Detail({label,value}:{label:string;value:string}) { return <div style={{padding:"10px 0",borderBottom:"1px solid #edf0ee"}}><small style={{color:"#69756f"}}>{label}</small><strong style={{display:"block",marginTop:3,fontSize:14,lineHeight:1.4}}>{value}</strong></div>; }
const shell = {minHeight:"100vh",background:"#f5f7f6",color:"#18231f",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif"} as const;
const panel = {background:"white",border:"1px solid #dde4e1",borderRadius:14,padding:18,boxShadow:"0 1px 2px rgba(15,23,42,.03)"} as const;
const eyebrow = {fontSize:12,textTransform:"uppercase",letterSpacing:".08em",fontWeight:800,color:"#356557"} as const;
const heading = {margin:"5px 0 7px",fontSize:21} as const;
const copy = {margin:"0 0 14px",color:"#65716b",lineHeight:1.5,maxWidth:760} as const;
const input = {display:"block",width:"100%",boxSizing:"border-box",marginTop:5,padding:"10px 11px",border:"1px solid #cbd5d1",borderRadius:8,fontSize:15,background:"white"} as const;
const primary = {border:"1px solid #173b32",background:"#173b32",color:"white",padding:"10px 13px",borderRadius:8,fontWeight:800,cursor:"pointer"} as const;
const secondary = {border:"1px solid #bcc9c4",background:"white",color:"#24312c",padding:"10px 13px",borderRadius:8,fontWeight:700,cursor:"pointer"} as const;
const chip = {border:"1px solid #d5dedb",borderRadius:999,padding:"6px 9px",fontSize:12,fontWeight:800,cursor:"pointer"} as const;
const versionPill = {padding:"6px 9px",borderRadius:999,background:"#e6f3ee",color:"#245f4d",fontSize:11,fontWeight:800} as const;
const th = {textAlign:"left",padding:"10px 12px",fontSize:12,color:"#69756f",background:"#f7f9f8",borderBottom:"1px solid #e1e6e4"} as const;
const td = {padding:"11px 12px",fontSize:13,borderBottom:"1px solid #edf0ee",verticalAlign:"top"} as const;
const status = {display:"inline-block",padding:"5px 7px",borderRadius:999,fontSize:10,fontWeight:800,textTransform:"uppercase"} as const;
