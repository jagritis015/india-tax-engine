"use client";

import { useEffect, useMemo, useState } from "react";
import { UAT_EMPLOYEES } from "../../../lib/uat-niva-data";

type PayrollInput = {
  employeeId: string;
  employeeName: string;
  workState: "Karnataka";
  taxYear: "2026-27";
  payrollMonth: 9;
  taxRegime: "new";
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bonus: number;
  commission: number;
  otherTaxableEarnings: number;
  taxableSalaryYtd: number;
  tdsDeductedYtd: number;
  pfApplicable: true;
  pfWages: number;
};

type EmployeeRecord = {
  id: string;
  name: string;
  role: string;
  sourceStatus: "Needs review" | "Blocked" | "Ready";
  payroll: PayrollInput;
};

type Calculation = {
  status: "CALCULATED" | "REVIEW_REQUIRED";
  grossSalary: number;
  projectedSalary: number | null;
  taxableIncome: number | null;
  annualTaxLiability: number | null;
  tds: number | null;
  employeePf: number | null;
  professionalTax: number | null;
  totalDeductions: number | null;
  netSalary: number | null;
  reviewReason: string | null;
};

const STORAGE_KEY = "niva-uat-payroll-master-v1";
const cash = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function seedRecords(): EmployeeRecord[] {
  return UAT_EMPLOYEES.map((employee) => {
    const basicSalary = Math.round(employee.gross * 0.45);
    const hra = Math.round(basicSalary * 0.5);
    const specialAllowance = employee.gross - basicSalary - hra;
    return {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      sourceStatus: employee.status,
      payroll: {
        employeeId: employee.id,
        employeeName: employee.name,
        workState: "Karnataka",
        taxYear: "2026-27",
        payrollMonth: 9,
        taxRegime: "new",
        basicSalary,
        hra,
        specialAllowance,
        bonus: 0,
        commission: 0,
        otherTaxableEarnings: 0,
        taxableSalaryYtd: employee.gross * 5,
        tdsDeductedYtd: 0,
        pfApplicable: true,
        pfWages: Math.min(basicSalary, 15000),
      },
    };
  });
}

export default function EmployeePayrollMasterPage() {
  const [records, setRecords] = useState<EmployeeRecord[]>(seedRecords);
  const [selectedId, setSelectedId] = useState("NVL-017");
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EmployeeRecord[];
        if (Array.isArray(parsed) && parsed.length === UAT_EMPLOYEES.length) setRecords(parsed);
      }
    } catch {
      setMessage("Saved UAT state could not be loaded. Seed data is shown instead.");
    } finally {
      setHydrated(true);
    }
  }, []);

  const selected = records.find((record) => record.id === selectedId) ?? records[0];
  const filtered = useMemo(() => records.filter((record) => `${record.id} ${record.name} ${record.role}`.toLowerCase().includes(query.toLowerCase())), [records, query]);

  function updateNumber(field: keyof PayrollInput, value: string) {
    const parsed = Number(value);
    setCalculation(null);
    setRecords((current) => current.map((record) => record.id === selected.id ? {
      ...record,
      payroll: { ...record.payroll, [field]: Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0 },
    } : record));
  }

  function saveWorkspace() {
    setSaving(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setMessage("Synthetic UAT payroll master saved in this browser workspace.");
    } catch {
      setMessage("The browser could not persist this UAT workspace.");
    } finally {
      setSaving(false);
    }
  }

  function resetWorkspace() {
    const seeded = seedRecords();
    setRecords(seeded);
    setCalculation(null);
    window.localStorage.removeItem(STORAGE_KEY);
    setMessage("UAT payroll master reset to the repository seed data.");
  }

  async function recalculate() {
    setCalculating(true);
    setMessage("");
    try {
      const response = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected.payroll),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Calculation failed");
      setCalculation(body);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Calculation failed.");
    } finally {
      setCalculating(false);
    }
  }

  const fields: Array<[keyof PayrollInput, string]> = [
    ["basicSalary", "Basic salary"],
    ["hra", "HRA"],
    ["specialAllowance", "Special allowance"],
    ["bonus", "Bonus"],
    ["commission", "Commission"],
    ["otherTaxableEarnings", "Other taxable earnings"],
    ["taxableSalaryYtd", "Taxable salary YTD"],
    ["tdsDeductedYtd", "TDS deducted YTD"],
    ["pfWages", "PF wages"],
  ];

  return <main style={{minHeight:"100vh",background:"#f6f8f7",color:"#17221d",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif"}}>
    <div style={{maxWidth:1420,margin:"0 auto",padding:"28px 18px 60px"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginBottom:20}}>
        <div><div style={{fontSize:13,color:"#617069",marginBottom:6}}>Niva Labs India Pvt Ltd · September 2026</div><h1 style={{margin:0,fontSize:32}}>Employee payroll master</h1><p style={{maxWidth:820,color:"#617069",lineHeight:1.5}}>Edit the source payroll inputs that feed the deterministic UAT calculation path. This is synthetic data only. Browser persistence is a temporary UAT adapter until shared durable storage is introduced.</p></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><a href="/uat/payroll-run" style={buttonStyle}>Payroll run</a><a href="/" style={buttonStyle}>Payroll OS</a></div>
      </header>

      <section style={{padding:14,border:"1px solid #d6e4dc",background:"#edf7f1",borderRadius:12,marginBottom:18,fontSize:14}}><strong>Functional UAT state</strong><div style={{marginTop:4,color:"#52625a"}}>Changes survive reloads in this browser after Save workspace. They do not yet represent multi-user production persistence.</div></section>

      <div style={{display:"grid",gridTemplateColumns:"minmax(270px,360px) minmax(0,1fr)",gap:18,alignItems:"start"}}>
        <aside style={{background:"white",border:"1px solid #dde4df",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:14,borderBottom:"1px solid #e5e9e6"}}><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search employee, ID or role" style={inputStyle}/></div>
          <div style={{maxHeight:720,overflowY:"auto"}}>{filtered.map((record) => <button key={record.id} onClick={()=>{setSelectedId(record.id);setCalculation(null)}} style={{width:"100%",textAlign:"left",padding:"12px 14px",border:0,borderBottom:"1px solid #edf0ee",background:record.id===selected.id?"#eef7f2":"white",cursor:"pointer"}}><strong style={{display:"block"}}>{record.name}</strong><span style={{fontSize:12,color:"#65716b"}}>{record.id} · {record.role}</span><span style={{display:"block",marginTop:4,fontSize:12,color:record.sourceStatus==="Ready"?"#28785c":"#9a5a00"}}>{record.sourceStatus}</span></button>)}</div>
        </aside>

        <section style={{display:"grid",gap:16}}>
          <article style={cardStyle}>
            <div style={{display:"flex",justifyContent:"space-between",gap:14,flexWrap:"wrap",alignItems:"center"}}><div><div style={{fontSize:12,color:"#68736e"}}>Source employee</div><h2 style={{margin:"3px 0 2px"}}>{selected.name}</h2><div style={{color:"#68736e",fontSize:14}}>{selected.id} · {selected.role}</div></div><span style={{padding:"7px 10px",borderRadius:999,background:selected.sourceStatus==="Ready"?"#e7f5ee":"#fff4df",color:selected.sourceStatus==="Ready"?"#246a52":"#8a5600",fontWeight:700,fontSize:13}}>{selected.sourceStatus}</span></div>
          </article>

          <article style={cardStyle}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:14}}><div><h3 style={{margin:0}}>September payroll inputs</h3><div style={{fontSize:13,color:"#68736e",marginTop:4}}>Tax year 2026-27 · New regime · Karnataka · PF applicable</div></div><div style={{display:"flex",gap:8}}><button onClick={resetWorkspace} style={buttonStyle}>Reset</button><button onClick={saveWorkspace} disabled={!hydrated||saving} style={primaryButtonStyle}>{saving?"Saving…":"Save workspace"}</button></div></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>{fields.map(([field,label]) => <label key={String(field)} style={{display:"grid",gap:6,fontSize:13,color:"#52605a"}}>{label}<input type="number" min="0" value={Number(selected.payroll[field])} onChange={(e)=>updateNumber(field,e.target.value)} style={inputStyle}/></label>)}</div>
            <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div style={{fontSize:13,color:"#68736e"}}>Monthly gross from components: <strong style={{color:"#17221d"}}>{cash.format(selected.payroll.basicSalary+selected.payroll.hra+selected.payroll.specialAllowance+selected.payroll.bonus+selected.payroll.commission+selected.payroll.otherTaxableEarnings)}</strong></div><button onClick={recalculate} disabled={calculating} style={primaryButtonStyle}>{calculating?"Calculating…":"Recalculate payroll"}</button></div>
          </article>

          {message&&<div style={{padding:12,borderRadius:10,background:"#fff8e7",border:"1px solid #ead9a3",fontSize:14}}>{message}</div>}

          {calculation&&<article style={cardStyle}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:14}}><div><h3 style={{margin:0}}>Deterministic calculation preview</h3><div style={{fontSize:13,color:"#68736e",marginTop:4}}>Server result from /api/payroll/calculate</div></div><strong style={{color:calculation.status==="CALCULATED"?"#28785c":"#9a5a00"}}>{calculation.status==="CALCULATED"?"Calculated":"Review required"}</strong></div>
            {calculation.reviewReason?<div style={{padding:12,borderRadius:10,background:"#fff4df",marginBottom:12}}>{calculation.reviewReason}</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10}}>{[
              ["Gross",calculation.grossSalary],["TDS",calculation.tds],["Employee PF",calculation.employeePf],["Karnataka PT",calculation.professionalTax],["Deductions",calculation.totalDeductions],["Net salary",calculation.netSalary],
            ].map(([label,value])=><div key={String(label)} style={{padding:12,border:"1px solid #e2e7e4",borderRadius:10}}><div style={{fontSize:12,color:"#68736e"}}>{label}</div><strong style={{display:"block",marginTop:4,fontSize:19}}>{value==null?"—":cash.format(Number(value))}</strong></div>)}</div>}
          </article>}
        </section>
      </div>
    </div>
  </main>;
}

const cardStyle = { background:"white", border:"1px solid #dde4df", borderRadius:12, padding:18 } as const;
const inputStyle = { width:"100%",boxSizing:"border-box",padding:"10px 11px",border:"1px solid #cfd7d2",borderRadius:9,fontSize:15,background:"white" } as const;
const buttonStyle = {display:"inline-block",padding:"10px 13px",border:"1px solid #cdd6d1",borderRadius:9,background:"white",color:"#17221d",textDecoration:"none",fontWeight:700,fontSize:14,cursor:"pointer"} as const;
const primaryButtonStyle = {padding:"10px 14px",border:0,borderRadius:9,background:"#28785c",color:"white",fontWeight:700,fontSize:14,cursor:"pointer"} as const;
