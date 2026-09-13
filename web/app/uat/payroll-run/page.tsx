"use client";

import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Row = {
  employeeId: string;
  employeeName: string;
  role: string;
  sourceStatus: "Needs review" | "Blocked" | "Ready";
  status: "CALCULATED" | "REVIEW_REQUIRED";
  scope: "uat-verified-subset";
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
  assumptions: string[];
};

type Run = {
  status: "CALCULATED_WITH_REVIEWS" | "CALCULATED";
  employeeCount: number;
  calculatedCount: number;
  reviewCount: number;
  grossPayroll: number;
  totalTds: number;
  totalEmployeePf: number;
  totalProfessionalTax: number;
  totalDeductions: number;
  netPayable: number;
  rows: Row[];
  assumptions: string[];
};

const cash = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function formatResult(value: number | null) {
  return value == null ? "—" : cash.format(value);
}

function ResultMetric({ label, value }: { label: string; value: number | null }) {
  return <div style={{padding:"12px 14px",border:"1px solid #e1e6e9",borderRadius:10,background:"#fafbfc"}}>
    <div style={{fontSize:13,color:"#68727d",marginBottom:4}}>{label}</div>
    <strong style={{fontSize:18}}>{value == null ? "Not calculated" : cash.format(value)}</strong>
  </div>;
}

function LineageStep({ label, value, note }: { label: string; value: number | null; note: string }) {
  return <li style={{padding:"0 0 16px 18px",borderLeft:"2px solid #cfe3da",position:"relative",listStyle:"none"}}>
    <span aria-hidden="true" style={{position:"absolute",left:-6,top:3,width:10,height:10,borderRadius:10,background:"#28785c"}} />
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"baseline"}}><strong>{label}</strong><strong style={{whiteSpace:"nowrap"}}>{formatResult(value)}</strong></div>
    <div style={{fontSize:14,color:"#68727d",lineHeight:1.45,marginTop:4}}>{note}</div>
  </li>;
}

function CalculationSheet({ row, onClose }: { row: Row | null; onClose: () => void }) {
  return <Sheet open={row !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <SheetContent side="right" className="w-[min(100%,580px)] max-w-[580px] gap-0 overflow-y-auto bg-white text-[#17202a] sm:max-w-[580px]">
      {row && <>
        <SheetHeader style={{padding:"24px 24px 18px",borderBottom:"1px solid #e4e8eb"}}>
          <div style={{fontSize:13,color:"#68727d"}}>{row.employeeId} · {row.role}</div>
          <SheetTitle style={{fontSize:24,lineHeight:1.2}}>Calculation for {row.employeeName}</SheetTitle>
          <SheetDescription style={{fontSize:14,lineHeight:1.5,color:"#68727d"}}>Server-returned payroll result for the controlled Karnataka UAT scope. This panel explains the result; it does not recalculate it.</SheetDescription>
        </SheetHeader>
        <div style={{padding:"22px 24px 32px"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:18}}>
            <span style={{fontSize:13,color:"#68727d"}}>Scope: {row.scope}</span>
            <strong style={{fontSize:13,color:row.status === "CALCULATED" ? "#28785c" : "#9a5a00"}}>{row.status === "CALCULATED" ? "Calculated" : "Review required"}</strong>
          </div>
          {row.status === "REVIEW_REQUIRED" ? <section style={{padding:16,border:"1px solid #ead5aa",background:"#fff7e8",borderRadius:12}}>
            <strong>Calculation stopped safely</strong>
            <p style={{margin:"7px 0 0",fontSize:14,lineHeight:1.5,color:"#6b5530"}}>{row.reviewReason}</p>
            <p style={{margin:"10px 0 0",fontSize:14,lineHeight:1.5,color:"#6b5530"}}>TDS, PF, PT, total deductions and net salary remain unavailable until this employee is reviewed.</p>
          </section> : <>
            <section>
              <h2 style={{fontSize:17,margin:"0 0 12px"}}>Server-returned result</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
                <ResultMetric label="Gross salary" value={row.grossSalary} />
                <ResultMetric label="Net salary" value={row.netSalary} />
                <ResultMetric label="Monthly TDS" value={row.tds} />
                <ResultMetric label="Total deductions" value={row.totalDeductions} />
              </div>
            </section>
            <section style={{marginTop:24}}>
              <h2 style={{fontSize:17,margin:"0 0 16px"}}>Calculation lineage</h2>
              <ol style={{margin:0,padding:0}}>
                <LineageStep label="Gross salary" value={row.grossSalary} note="Monthly taxable earnings returned by the payroll service." />
                <LineageStep label="Projected salary" value={row.projectedSalary} note="Taxable salary year to date plus seven remaining payroll months in the verified September profile." />
                <LineageStep label="Taxable income" value={row.taxableIncome} note="Projected salary after the ₹75,000 standard deduction." />
                <LineageStep label="Annual tax liability" value={row.annualTaxLiability} note="New-regime slab tax after applicable rebate or marginal relief and 4% cess, rounded under the verified rule path." />
                <LineageStep label="Monthly TDS" value={row.tds} note="Remaining annual liability after YTD TDS, allocated across seven payroll months." />
                <LineageStep label="Employee PF" value={row.employeePf} note="12% employee contribution on PF wages, capped at the ₹15,000 wage ceiling for this UAT profile." />
                <LineageStep label="Karnataka Professional Tax" value={row.professionalTax} note="₹200 when monthly gross is at least ₹25,000; otherwise ₹0 in this verified profile." />
              </ol>
            </section>
            <section style={{marginTop:6,padding:16,border:"1px solid #cfe3da",background:"#edf7f2",borderRadius:12}}>
              <strong>Deterministic identities</strong>
              <div style={{fontSize:14,lineHeight:1.55,marginTop:8}}>TDS {formatResult(row.tds)} + employee PF {formatResult(row.employeePf)} + Karnataka PT {formatResult(row.professionalTax)} = total deductions {formatResult(row.totalDeductions)}</div>
              <div style={{fontSize:14,lineHeight:1.55,marginTop:5}}>Gross salary {cash.format(row.grossSalary)} − total deductions {formatResult(row.totalDeductions)} = net salary {formatResult(row.netSalary)}</div>
            </section>
          </>}
          <details style={{marginTop:20}}>
            <summary style={{fontWeight:700,cursor:"pointer"}}>Calculation scope and assumptions</summary>
            {row.assumptions.length ? <ul style={{paddingLeft:20,color:"#5e6871",fontSize:14,lineHeight:1.55}}>{row.assumptions.map((item)=><li key={item} style={{marginTop:6}}>{item}</li>)}</ul> : <p style={{fontSize:14,color:"#68727d"}}>No calculation assumptions were applied because this row requires review.</p>}
          </details>
        </div>
      </>}
    </SheetContent>
  </Sheet>;
}

export default function PayrollRunPage() {
  const [run, setRun] = useState<Run | null>(null);
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "calculated" | "review">("all");
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);

  async function runPayroll() {
    setRunning(true);
    setSelectedRow(null);
    try {
      const response = await fetch("/api/payroll/run", { method: "POST" });
      if (!response.ok) throw new Error("Payroll run failed");
      setRun(await response.json());
    } catch {
      alert("The payroll run service could not complete this run.");
    } finally {
      setRunning(false);
    }
  }

  const rows = useMemo(() => {
    if (!run) return [];
    return run.rows.filter((row) => {
      const matchesQuery = `${row.employeeId} ${row.employeeName} ${row.role}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "all" || (filter === "calculated" ? row.status === "CALCULATED" : row.status === "REVIEW_REQUIRED");
      return matchesQuery && matchesFilter;
    });
  }, [run, query, filter]);

  function downloadRegister() {
    if (!run) return;
    const header = ["Employee ID","Employee","Role","Status","Gross","TDS","Employee PF","Professional Tax","Total Deductions","Net Salary","Review Reason"];
    const body = run.rows.map((row) => [
      row.employeeId,row.employeeName,row.role,row.status,row.grossSalary,row.tds ?? "",row.employeePf ?? "",row.professionalTax ?? "",row.totalDeductions ?? "",row.netSalary ?? "",row.reviewReason ?? "",
    ]);
    const csv = [header, ...body].map((line) => line.map((value) => `"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "niva-labs-sep-2026-calculated-payroll-register.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return <main style={{minHeight:"100vh",background:"#f7f8fa",color:"#17202a",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif"}}>
    <div style={{maxWidth:1280,margin:"0 auto",padding:"32px 20px 64px"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap",marginBottom:24}}>
        <div><div style={{fontSize:13,color:"#68727d",marginBottom:6}}>Niva Labs India Pvt Ltd · September 2026</div><h1 style={{margin:0,fontSize:32}}>100 employee payroll run</h1><p style={{color:"#68727d",maxWidth:760}}>Run the current founder UAT population through the deterministic server calculation path. Ready employees calculate. Existing exceptions remain review required.</p></div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><a href="/" style={{padding:"11px 14px",border:"1px solid #cfd5da",borderRadius:9,color:"inherit",textDecoration:"none",background:"white"}}>Back to Payroll OS</a><button onClick={runPayroll} disabled={running} style={{padding:"11px 16px",border:0,borderRadius:9,background:"#28785c",color:"white",fontWeight:700,cursor:"pointer"}}>{running?"Running payroll…":run?"Run again":"Run payroll"}</button></div>
      </header>

      <section style={{padding:16,border:"1px solid #dfe5e1",background:"#edf7f2",borderRadius:12,marginBottom:22}}><strong>Controlled UAT profile</strong><div style={{fontSize:14,marginTop:5,color:"#51605a"}}>This run exercises real calculation behavior under the currently verified Karnataka/new-regime UAT slice. It is not yet the final statutory master for every employee location and declaration.</div></section>

      {!run && <section style={{padding:28,border:"1px solid #dde2e6",background:"white",borderRadius:12,textAlign:"center"}}><h2 style={{marginTop:0}}>Ready to calculate</h2><p style={{color:"#68727d"}}>Click Run payroll to calculate the Niva Labs population server-side and return company totals plus employee-level outputs.</p></section>}

      {run && <>
        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
          {[
            ["Employees",String(run.employeeCount)],
            ["Calculated",String(run.calculatedCount)],
            ["Review required",String(run.reviewCount)],
            ["Calculated gross",cash.format(run.grossPayroll)],
            ["TDS",cash.format(run.totalTds)],
            ["Employee PF",cash.format(run.totalEmployeePf)],
            ["Professional Tax",cash.format(run.totalProfessionalTax)],
            ["Net payable",cash.format(run.netPayable)],
          ].map(([label,value])=><article key={label} style={{background:"white",border:"1px solid #dde2e6",borderRadius:12,padding:16}}><div style={{fontSize:13,color:"#68727d"}}>{label}</div><strong style={{fontSize:22,display:"block",marginTop:5}}>{value}</strong></article>)}
        </section>

        <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search employee, ID or role" style={{minWidth:260,padding:"10px 12px",border:"1px solid #cfd5da",borderRadius:9,fontSize:16}}/>
            <select value={filter} onChange={(e)=>setFilter(e.target.value as typeof filter)} style={{padding:"10px 12px",border:"1px solid #cfd5da",borderRadius:9,fontSize:16,background:"white"}}><option value="all">All employees</option><option value="calculated">Calculated</option><option value="review">Review required</option></select>
          </div>
          <button onClick={downloadRegister} style={{padding:"10px 14px",border:"1px solid #cfd5da",borderRadius:9,background:"white",fontWeight:700}}>Download payroll register</button>
        </div>

        <div style={{overflowX:"auto",background:"white",border:"1px solid #dde2e6",borderRadius:12}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:1160}}><thead><tr>{["Employee","Role","Status","Gross","TDS","PF","PT","Deductions","Net pay","Audit"].map((x)=><th key={x} style={{textAlign:"left",padding:"12px 14px",fontSize:12,color:"#68727d",borderBottom:"1px solid #e4e8eb",background:"#fafbfc"}}>{x}</th>)}</tr></thead><tbody>{rows.map((row)=><tr key={row.employeeId}><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}><strong>{row.employeeName}</strong><div style={{fontSize:12,color:"#68727d"}}>{row.employeeId}</div></td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}>{row.role}</td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}><strong style={{color:row.status==="CALCULATED"?"#28785c":"#9a5a00"}}>{row.status==="CALCULATED"?"Calculated":"Review required"}</strong>{row.reviewReason&&<div style={{fontSize:12,color:"#68727d",maxWidth:240}}>{row.reviewReason}</div>}</td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}>{cash.format(row.grossSalary)}</td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}>{row.tds==null?"—":cash.format(row.tds)}</td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}>{row.employeePf==null?"—":cash.format(row.employeePf)}</td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}>{row.professionalTax==null?"—":cash.format(row.professionalTax)}</td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}>{row.totalDeductions==null?"—":cash.format(row.totalDeductions)}</td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2",fontWeight:700}}>{row.netSalary==null?"—":cash.format(row.netSalary)}</td><td style={{padding:"12px 14px",borderBottom:"1px solid #edf0f2"}}><button type="button" onClick={()=>setSelectedRow(row)} aria-label={"View calculation for " + row.employeeName} style={{padding:"8px 10px",border:"1px solid #9bc5b4",borderRadius:8,background:"#f3faf7",color:"#1f684f",fontWeight:700,whiteSpace:"nowrap",cursor:"pointer"}}>View calculation</button></td></tr>)}</tbody></table></div>

        <section style={{marginTop:20,padding:18,background:"white",border:"1px solid #dde2e6",borderRadius:12}}><strong>Run assumptions</strong><ul style={{marginBottom:0,color:"#5e6871"}}>{run.assumptions.map((item)=><li key={item} style={{marginTop:6}}>{item}</li>)}</ul></section>
      </>}
      <CalculationSheet row={selectedRow} onClose={()=>setSelectedRow(null)} />
    </div>
  </main>;
}
