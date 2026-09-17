"use client";

import { useMemo, useState } from "react";
import { INDIA_PAYROLL_COMPONENTS, NIVA_GLOBAL_TECH_TEMPLATE, type PayrollComponentCategory } from "@/lib/india-payroll-components";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const categories = ["All", ...Array.from(new Set(INDIA_PAYROLL_COMPONENTS.map((item) => item.category)))] as Array<"All" | PayrollComponentCategory>;
const initialValues = { BASIC: "100000", HRA: "40000", SPL_ALLOW: "60000", PERF_BONUS: "0", SALES_COMM: "0" };
const initialContext = { taxableSalaryYtd: "1000000", tdsDeductedYtd: "0", pfWages: "15000" };

type Calculation = { status?: string; error?: string; inputComponents?: Array<{code:string;amount:number}>; calculatedComponents?: Array<{code:string;amount:number|null}>; result?: {status:string;grossSalary:number;tds:number;employeePf:number;professionalTax:number;totalDeductions:number;netSalary:number;reviewReason?:string} };

export default function PayrollComponentsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedCode, setSelectedCode] = useState("BASIC");
  const [values, setValues] = useState(initialValues);
  const [payrollContext, setPayrollContext] = useState(initialContext);
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
      const response = await fetch("/api/payroll/components", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeId: "NVL-UAT-001", employeeName: "Aarav Mehta", values: Object.fromEntries(Object.entries(values).map(([code, amount]) => [code, Number(amount)])), taxableSalaryYtd: Number(payrollContext.taxableSalaryYtd), tdsDeductedYtd: Number(payrollContext.tdsDeductedYtd), pfWages: Number(payrollContext.pfWages) }) });
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

    <section style={{...panel,marginTop:18,padding:0,overflow:"hidden"}}>
      <div style={calcHeader}>
        <div><div style={{...eyebrow,color:"#9bd0bc"}}>September 2026 payroll</div><h2 style={{...heading,color:"white",fontSize:25,marginTop:7}}>Employee pay calculation</h2><p style={{...copy,color:"#c9ddd5",marginBottom:0}}>Aarav Mehta · NVL-UAT-001 · Karnataka · New tax regime</p></div>
        <span style={verifiedPill}>DETERMINISTIC ENGINE</span>
      </div>
      <div style={{padding:20,display:"grid",gap:18}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))",gap:18}}>
          <section style={workCard}>
            <div style={sectionTitleRow}><div><div style={step}>1</div><h3 style={subheading}>Monthly earnings</h3></div><span style={quietPill}>INR</span></div>
            <p style={helper}>Enter this month&apos;s payable amounts. All five components are included in gross salary.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:11}}>{Object.entries(values).map(([code,amount])=><label key={code} style={fieldLabel}>{componentLabel(code)}<span style={fieldCode}>{code}</span><div style={moneyInput}><span>₹</span><input aria-label={code} type="number" min="0" step="1" value={amount} onChange={(e)=>setValues((current)=>({...current,[code]:e.target.value}))} style={bareInput}/></div></label>)}</div>
          </section>
          <section style={workCard}>
            <div style={sectionTitleRow}><div><div style={step}>2</div><h3 style={subheading}>Tax and statutory context</h3></div><span style={quietPill}>VISIBLE ASSUMPTIONS</span></div>
            <p style={helper}>These values affect TDS and PF. Change them to test catch-up deductions and employee history.</p>
            <div style={{display:"grid",gap:11}}>
              <ContextField label="Taxable salary paid before September" hint="April to August" value={payrollContext.taxableSalaryYtd} onChange={(value)=>setPayrollContext((current)=>({...current,taxableSalaryYtd:value}))}/>
              <ContextField label="TDS already deducted" hint="April to August" value={payrollContext.tdsDeductedYtd} onChange={(value)=>setPayrollContext((current)=>({...current,tdsDeductedYtd:value}))}/>
              <ContextField label="PF qualifying wages" hint="Statutory base for this month" value={payrollContext.pfWages} onChange={(value)=>setPayrollContext((current)=>({...current,pfWages:value}))}/>
            </div>
            <div style={assumptionStrip}><span>Tax year 2026–27</span><span>7 months remaining</span><span>₹75,000 standard deduction</span></div>
          </section>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:13,flexWrap:"wrap"}}><button aria-label="Run component calculation" onClick={calculate} disabled={running} style={{...primary,padding:"12px 18px",fontSize:15,opacity:running?.7:1}}>{running?"Calculating payroll…":"Calculate September payroll"}</button><span style={{fontSize:13,color:"#66736d"}}>No AI performs or changes statutory arithmetic.</span></div>
        {result?.result?.status==="CALCULATED"&&<section style={resultPanel}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap",marginBottom:16}}><div><div style={{...eyebrow,color:"#377262"}}>Calculation complete</div><h3 style={{...subheading,fontSize:21,marginTop:5}}>September payslip preview</h3></div><span style={successPill}>READY FOR REVIEW</span></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))",gap:16}}>
            <div style={netCard}><span style={{fontSize:13,color:"#c9ded6"}}>Net salary payable</span><strong style={{display:"block",fontSize:34,margin:"8px 0 16px",letterSpacing:"-.02em"}}>{money.format(result.result.netSalary)}</strong><div style={{display:"flex",justifyContent:"space-between",paddingTop:13,borderTop:"1px solid rgba(255,255,255,.16)",fontSize:13}}><span>Gross salary</span><strong>{money.format(result.result.grossSalary)}</strong></div></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:10}}><ResultMetric label="Income tax (TDS)" value={money.format(result.result.tds)} tone="tax"/><ResultMetric label="Employee PF" value={money.format(result.result.employeePf)}/><ResultMetric label="Karnataka PT" value={money.format(result.result.professionalTax)}/><ResultMetric label="Total deductions" value={money.format(result.result.totalDeductions)} emphasis/></div>
          </div>
          <details style={explain}><summary style={{cursor:"pointer",fontWeight:800,color:"#204d40"}}>How this TDS was calculated</summary><div style={{marginTop:13,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10}}><AuditLine label="Salary already paid" value={money.format(Number(payrollContext.taxableSalaryYtd))}/><AuditLine label="Projected remaining salary" value={money.format(result.result.grossSalary*7)}/><AuditLine label="Projected annual salary" value={money.format(Number(payrollContext.taxableSalaryYtd)+(result.result.grossSalary*7))}/><AuditLine label="TDS already deducted" value={money.format(Number(payrollContext.tdsDeductedYtd))}/></div><p style={{margin:"13px 0 0",fontSize:13,color:"#59675f",lineHeight:1.55}}>The engine projects annual taxable salary, applies the new regime slabs and 4% cess, subtracts TDS already deducted, then spreads the remaining liability over September to March.</p></details>
        </section>}
        {(result?.error||result?.result?.status==="REVIEW_REQUIRED")&&<div style={{padding:15,borderRadius:11,background:"#fff6df",border:"1px solid #f0d38c",color:"#73500b"}}><strong>Calculation stopped for review.</strong> {result.error??result.result?.reviewReason}</div>}
      </div>
    </section>

    <p style={{fontSize:13,color:"#667085",marginTop:16,lineHeight:1.5}}>UAT scope: catalogue definitions are versioned system configuration. Components marked Reference only are visible for design review but cannot produce money until their deterministic rules are implemented and verified.</p>
  </div></main>;
}

const yes = (value:boolean) => value ? "Yes" : "No";
const componentLabel = (code:string) => ({BASIC:"Basic salary",HRA:"House rent allowance",SPL_ALLOW:"Special allowance",PERF_BONUS:"Performance bonus",SALES_COMM:"Sales commission"}[code]??code);
function Metric({label,value}:{label:string;value:string}) { return <article style={{background:"white",border:"1px solid #e1e6e4",borderRadius:11,padding:14}}><small style={{color:"#69756f"}}>{label}</small><strong style={{display:"block",fontSize:20,marginTop:4}}>{value}</strong></article>; }
function Detail({label,value}:{label:string;value:string}) { return <div style={{padding:"10px 0",borderBottom:"1px solid #edf0ee"}}><small style={{color:"#69756f"}}>{label}</small><strong style={{display:"block",marginTop:3,fontSize:14,lineHeight:1.4}}>{value}</strong></div>; }
function ContextField({label,hint,value,onChange}:{label:string;hint:string;value:string;onChange:(value:string)=>void}) { return <label style={{...fieldLabel,display:"grid",gridTemplateColumns:"1fr minmax(130px,.5fr)",gap:12,alignItems:"center"}}><span>{label}<small style={{display:"block",fontWeight:500,color:"#7a8580",marginTop:3}}>{hint}</small></span><div style={{...moneyInput,marginTop:0}}><span>₹</span><input aria-label={label} type="number" min="0" step="1" value={value} onChange={(event)=>onChange(event.target.value)} style={bareInput}/></div></label>; }
function ResultMetric({label,value,emphasis=false,tone="normal"}:{label:string;value:string;emphasis?:boolean;tone?:"normal"|"tax"}) { return <article style={{background:emphasis?"#eef7f3":tone==="tax"?"#fff8eb":"white",border:`1px solid ${emphasis?"#bcd9ce":tone==="tax"?"#eed8a8":"#dfe7e3"}`,borderRadius:12,padding:15}}><small style={{color:"#68756f"}}>{label}</small><strong style={{display:"block",fontSize:20,marginTop:7,color:emphasis?"#174d3d":"#17251f"}}>{value}</strong></article>; }
function AuditLine({label,value}:{label:string;value:string}) { return <div style={{padding:"10px 12px",borderRadius:9,background:"white",border:"1px solid #e2e9e6"}}><small style={{color:"#6d7973"}}>{label}</small><strong style={{display:"block",marginTop:4}}>{value}</strong></div>; }
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
const calcHeader = {background:"linear-gradient(135deg,#143d32 0%,#20594a 100%)",padding:"22px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap"} as const;
const verifiedPill = {padding:"7px 10px",borderRadius:999,background:"rgba(255,255,255,.11)",border:"1px solid rgba(255,255,255,.2)",color:"#e7f4ef",fontSize:11,fontWeight:800,letterSpacing:".04em"} as const;
const workCard = {border:"1px solid #dfe7e3",borderRadius:13,padding:17,background:"#fbfcfc"} as const;
const sectionTitleRow = {display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12} as const;
const step = {display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:7,background:"#dceee7",color:"#205846",fontSize:12,fontWeight:900,float:"left",marginRight:9} as const;
const subheading = {margin:0,fontSize:17,color:"#17251f",lineHeight:"24px"} as const;
const helper = {margin:"10px 0 15px",fontSize:13,color:"#68756f",lineHeight:1.5} as const;
const quietPill = {padding:"5px 8px",borderRadius:999,background:"#eef3f1",color:"#5b6b64",fontSize:10,fontWeight:800,whiteSpace:"nowrap"} as const;
const fieldLabel = {fontSize:13,fontWeight:700,color:"#293a33"} as const;
const fieldCode = {display:"block",fontSize:10,color:"#84908b",margin:"3px 0 6px",letterSpacing:".04em"} as const;
const moneyInput = {display:"flex",alignItems:"center",gap:7,marginTop:6,padding:"9px 10px",border:"1px solid #cbd7d2",borderRadius:9,background:"white",color:"#6b7872"} as const;
const bareInput = {border:0,outline:0,width:"100%",fontSize:15,fontWeight:750,color:"#182620",background:"transparent",minWidth:0} as const;
const assumptionStrip = {display:"flex",gap:13,flexWrap:"wrap",marginTop:13,fontSize:11,color:"#55645e"} as const;
const resultPanel = {padding:18,borderRadius:14,background:"#f4f9f7",border:"1px solid #cfe2da"} as const;
const successPill = {padding:"6px 9px",borderRadius:999,background:"#d9eee5",color:"#24634e",fontSize:10,fontWeight:900} as const;
const netCard = {padding:18,borderRadius:13,background:"linear-gradient(145deg,#173e34,#245d4d)",color:"white"} as const;
const explain = {marginTop:14,padding:"13px 14px",borderRadius:11,background:"#ffffff",border:"1px solid #dce6e2"} as const;
