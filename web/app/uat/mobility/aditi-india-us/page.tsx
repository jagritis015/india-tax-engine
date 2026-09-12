"use client";

import { useMemo, useState } from "react";
import { assessSubstantialPresence } from "../../../../lib/us-substantial-presence";

const cash = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AditiIndiaUsMobilityPage() {
  const [hostState, setHostState] = useState("");
  const [currentDays, setCurrentDays] = useState(120);
  const [priorDays, setPriorDays] = useState(30);
  const [secondPriorDays, setSecondPriorDays] = useState(0);
  const [excludedDays, setExcludedDays] = useState(0);
  const [housing, setHousing] = useState(250000);
  const [mobilityAllowance, setMobilityAllowance] = useState(100000);

  const spt = useMemo(() => assessSubstantialPresence({
    currentYearDays: currentDays,
    priorYearDays: priorDays,
    secondPriorYearDays: secondPriorDays,
    excludedCurrentYearDays: excludedDays,
  }), [currentDays, priorDays, secondPriorDays, excludedDays]);

  const guardian = useMemo(() => {
    const items: string[] = [];
    if (!hostState.trim()) items.push("U.S. host state is missing, so state tax cannot be assessed.");
    if (spt.status === "MEETS_SPT") items.push("Federal substantial-presence threshold is met. Tax-position review is required before monetary U.S. tax is calculated.");
    if (spt.status === "REVIEW_REQUIRED") items.push(spt.reviewReason ?? "U.S. day-count evidence requires review.");
    items.push("U.S. federal/state monetary tax engine is not yet verified. Actual U.S. tax remains fail-closed.");
    items.push("India–U.S. social-security position requires specialist review; no totalization route is assumed.");
    items.push("Immigration category and work authorization require verified case evidence before payroll activation.");
    return items;
  }, [hostState, spt]);

  const monthlyIndiaGross = 156000;
  const monthlyAssignmentComp = monthlyIndiaGross + housing + mobilityAllowance;

  const workstreams = [
    { label: "Location & residency", detail: "Evidence-backed day ledger feeding the U.S. substantial-presence assessment.", status: "In review", href: "/uat/mobility/aditi-india-us/day-ledger" },
    { label: "Compensation", detail: "One global compensation ledger across salary and assignment allowances.", status: "Structured", href: "/uat/mobility/aditi-india-us/compensation" },
    { label: "India hypothetical tax", detail: "Policy-defined stay-at-home India tax using the deterministic India engine.", status: "Calculable", href: "/uat/mobility/aditi-india-us/hypothetical-tax" },
    { label: "U.S. actual tax", detail: "Federal, state and local monetary engines remain intentionally fail-closed.", status: "Engine not verified", href: null },
    { label: "Immigration", detail: "Case evidence and work authorization are required before payroll activation.", status: "Specialist review", href: null },
    { label: "Social security", detail: "India–U.S. position remains a separate specialist workstream.", status: "Specialist review", href: null },
  ] as const;

  return <main style={{minHeight:"100vh",background:"#f6f8fa",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif",color:"#18212b"}}>
    <div style={{maxWidth:1180,margin:"0 auto",padding:"28px 18px 64px"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
        <div><div style={{fontSize:13,color:"#6b7480",marginBottom:6}}>Niva Labs · Global Mobility UAT</div><h1 style={{margin:"0 0 8px",fontSize:32}}>Aditi Joshi · India → United States</h1><p style={{margin:0,color:"#5d6772",maxWidth:760}}>One mobility case connecting assignment facts, location evidence, compensation, hypothetical tax and Guardian risks. Unsupported U.S. monetary tax remains review-required.</p></div>
        <a href="/" style={{textDecoration:"none",color:"inherit",border:"1px solid #cfd6dc",background:"white",padding:"10px 13px",borderRadius:9}}>Back to Payroll OS</a>
      </header>

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginBottom:18}}>
        {[["Employee","NVL-017 · Aditi Joshi"],["Home","Bengaluru, Karnataka"],["Assignment","24-month long-term"],["Policy","Tax equalization"],["Home payroll","Assessment required"],["Host payroll","Assessment required"]].map(([label,value])=><article key={label} style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:15}}><div style={{fontSize:12,color:"#737d87"}}>{label}</div><strong style={{display:"block",marginTop:5}}>{value}</strong></article>)}
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:14}}><div><h2 style={{margin:"0 0 6px"}}>Mobility case workstreams</h2><p style={{margin:0,color:"#66717b"}}>Open each verified workstream from the same case instead of treating mobility as separate calculators.</p></div><span style={{padding:"6px 9px",borderRadius:999,background:"#fff3d8",fontSize:12,fontWeight:700}}>4 open reviews</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
          {workstreams.map(item=>{
            const content = <><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"}}><strong>{item.label}</strong><span style={{fontSize:11,padding:"4px 7px",borderRadius:999,background:item.status==="Calculable"||item.status==="Structured"?"#e9f6ef":"#fff3d8"}}>{item.status}</span></div><p style={{margin:"8px 0 0",fontSize:13,color:"#66717b",lineHeight:1.45}}>{item.detail}</p></>;
            return item.href ? <a key={item.label} href={item.href} style={{display:"block",padding:14,border:"1px solid #dce2e7",borderRadius:10,textDecoration:"none",color:"inherit",background:"#fbfcfd"}}>{content}</a> : <div key={item.label} style={{padding:14,border:"1px solid #dce2e7",borderRadius:10,background:"#fbfcfd"}}>{content}</div>;
          })}
        </div>
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18,marginBottom:18}}>
        <h2 style={{marginTop:0}}>Assignment facts</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          <label><small>U.S. host state</small><input value={hostState} onChange={e=>setHostState(e.target.value)} placeholder="Required, e.g. California" style={input}/></label>
          <label><small>Monthly housing allowance (INR)</small><input type="number" min="0" value={housing} onChange={e=>setHousing(Number(e.target.value))} style={input}/></label>
          <label><small>Monthly mobility allowance (INR)</small><input type="number" min="0" value={mobilityAllowance} onChange={e=>setMobilityAllowance(Number(e.target.value))} style={input}/></label>
        </div>
        <div style={{marginTop:14,padding:14,background:"#f8fafb",borderRadius:9}}><strong>Compensation view</strong><div style={{marginTop:6,color:"#5f6872"}}>India monthly gross {cash.format(monthlyIndiaGross)} + assignment allowances = <strong>{cash.format(monthlyAssignmentComp)}</strong>. Tax treatment by jurisdiction is not assumed.</div></div>
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}><div><h2 style={{margin:"0 0 6px"}}>U.S. substantial presence test</h2><p style={{margin:0,color:"#66717b",maxWidth:760}}>Enter verified physical-presence days. The engine applies all counted current-year days + 1/3 prior-year days + 1/6 second-prior-year days, together with the 31-day current-year requirement.</p></div><span style={{padding:"6px 9px",borderRadius:999,background:spt.status==="MEETS_SPT"?"#fff3d8":"#e9f6ef",fontSize:12,fontWeight:700}}>{spt.status.replaceAll("_"," ")}</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginTop:14}}>
          <label><small>Current-year days</small><input type="number" min="0" max="366" value={currentDays} onChange={e=>setCurrentDays(Number(e.target.value))} style={input}/></label>
          <label><small>Prior-year days</small><input type="number" min="0" max="366" value={priorDays} onChange={e=>setPriorDays(Number(e.target.value))} style={input}/></label>
          <label><small>Second-prior-year days</small><input type="number" min="0" max="366" value={secondPriorDays} onChange={e=>setSecondPriorDays(Number(e.target.value))} style={input}/></label>
          <label><small>Excluded current-year days</small><input type="number" min="0" max="366" value={excludedDays} onChange={e=>setExcludedDays(Number(e.target.value))} style={input}/></label>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginTop:14}}>
          {[["Counted current year",String(spt.currentYearCountedDays)],["Weighted 3-year days",String(spt.weightedDays)],["31-day test",spt.currentYear31DayTest?"Pass":"Not met"],["183 weighted-day test",spt.threeYear183DayTest?"Pass":"Not met"],["Rule version",spt.ruleVersion]].map(([label,value])=><div key={label} style={{padding:12,border:"1px solid #e1e6ea",borderRadius:9}}><small style={{color:"#717b85"}}>{label}</small><strong style={{display:"block",marginTop:4}}>{value}</strong></div>)}
        </div>
        <p style={{fontSize:12,color:"#737d87",marginBottom:0}}>This result is a federal tax-residency fact assessment only. Closer-connection, treaty, green-card and other legal/tax positions remain separate review objects.</p>
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18}}>
        <h2 style={{marginTop:0}}>Mobility Guardian</h2>
        <div style={{display:"grid",gap:9}}>{guardian.map((item,i)=><div key={i} style={{padding:12,border:"1px solid #eadfc6",background:"#fffaf0",borderRadius:9}}>{item}</div>)}</div>
      </section>
    </div>
  </main>;
}

const input: React.CSSProperties = {width:"100%",boxSizing:"border-box",marginTop:6,padding:"10px 11px",border:"1px solid #cfd6dc",borderRadius:8,fontSize:15,background:"white"};
