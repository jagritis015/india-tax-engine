"use client";

import { useEffect, useMemo, useState } from "react";
import type { MobilityCaseSummary } from "../../../../lib/uat-mobility-case-summary";
import { assessSubstantialPresence } from "../../../../lib/us-substantial-presence";

const cash = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AditiIndiaUsMobilityPage() {
  const [caseSummary, setCaseSummary] = useState<MobilityCaseSummary | null>(null);
  const [caseSummaryError, setCaseSummaryError] = useState(false);
  const [hostState, setHostState] = useState("");
  const [currentDays, setCurrentDays] = useState(120);
  const [priorDays, setPriorDays] = useState(30);
  const [secondPriorDays, setSecondPriorDays] = useState(0);
  const [excludedDays, setExcludedDays] = useState(0);
  const [housing, setHousing] = useState(250000);
  const [mobilityAllowance, setMobilityAllowance] = useState(100000);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/mobility/aditi-india-us/summary", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Mobility case summary unavailable");
        return response.json() as Promise<MobilityCaseSummary>;
      })
      .then((summary) => {
        setCaseSummary(summary);
        setCaseSummaryError(false);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCaseSummaryError(true);
      });
    return () => controller.abort();
  }, []);

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

  const workstreamDetails: Record<string, string> = {
    location: "Evidence-backed day ledger feeding the U.S. substantial-presence assessment.",
    "host-state": "Authoritative case blocker. A verified U.S. host state is required before state tax scope can be assessed.",
    compensation: "One global compensation ledger across salary and assignment allowances.",
    "india-hypothetical-tax": "Policy-defined stay-at-home India tax using the deterministic India engine.",
    "us-tax": "Engine not verified. Federal, state and local monetary calculations remain intentionally fail-closed.",
    immigration: "Specialist review required. Case evidence and work authorization are required before payroll activation.",
    "social-security": "Specialist review required. The India–U.S. position remains a separate evidence-backed workstream.",
  };

  return <main style={{minHeight:"100vh",background:"#f6f8fa",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif",color:"#18212b"}}>
    <div style={{maxWidth:1180,margin:"0 auto",padding:"28px 18px 64px"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
        <div><div style={{fontSize:13,color:"#6b7480",marginBottom:6}}>Niva Labs · Global Mobility UAT</div><h1 style={{margin:"0 0 8px",fontSize:32}}>Aditi Joshi · India → United States</h1><p style={{margin:0,color:"#5d6772",maxWidth:760}}>One mobility case connecting assignment facts, location evidence, compensation, hypothetical tax and Guardian risks. Unsupported U.S. monetary tax remains review-required.</p></div>
        <a href="/" style={{textDecoration:"none",color:"inherit",border:"1px solid #cfd6dc",background:"white",padding:"10px 13px",borderRadius:9}}>Back to Payroll OS</a>
      </header>

      <section style={{background:"linear-gradient(135deg,#173b32,#0b6b52)",color:"white",borderRadius:14,padding:20,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"#c2d8d1",fontWeight:800}}>Unified case control</div><h2 style={{margin:"6px 0 7px"}}>{caseSummary?.caseId ?? "MOB-NVL-017-IND-US"}</h2><p style={{margin:0,color:"#c9d9d4",maxWidth:720}}>One server-controlled case state now drives readiness, evidence, compensation and India hypothetical-tax status.</p></div>
          <a href="/uat/mobility/aditi-india-us/readiness" style={{textDecoration:"none",background:"#d8f65a",color:"#17312a",padding:"10px 13px",borderRadius:9,fontWeight:800}}>Review activation gates</a>
        </div>
        {caseSummaryError&&<div style={{marginTop:16,padding:12,border:"1px solid #ffb4a7",background:"#7a291f",borderRadius:9}}>Case state could not be loaded. Payroll activation remains blocked and no monetary assumption has been made.</div>}
        {!caseSummary&&!caseSummaryError&&<div style={{marginTop:16,color:"#c9d9d4"}}>Loading deterministic case state…</div>}
        {caseSummary&&<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10,marginTop:16}}>
          {[
            ["Overall status",caseSummary.overallStatus.replaceAll("_"," ")],
            ["Payroll activation",caseSummary.payrollActivationAllowed?"Allowed":"Blocked"],
            ["Assignment compensation",cash.format(caseSummary.monthlyAssignmentCompInr)],
            ["India hypothetical withholding",caseSummary.hypotheticalMonthlyWithholdingInr==null?"Review required":cash.format(caseSummary.hypotheticalMonthlyWithholdingInr)],
          ].map(([label,value])=><div key={label} style={{padding:12,border:"1px solid #ffffff24",background:"#ffffff0d",borderRadius:10}}><small style={{display:"block",color:"#bcd0ca"}}>{label}</small><strong style={{display:"block",marginTop:5}}>{value}</strong></div>)}
        </div><div style={{display:"flex",gap:"8px 20px",flexWrap:"wrap",marginTop:14,fontSize:12,color:"#d7e5e0"}}><span><strong>{caseSummary.pendingDayEvidence}</strong> pending day evidence</span><span><strong>{caseSummary.unresolvedCompensationItems}</strong> compensation reviews</span><span>SPT: <strong>{caseSummary.substantialPresenceStatus.replaceAll("_"," ")}</strong></span><span><strong>{caseSummary.blockers}</strong> blockers · <strong>{caseSummary.openReviews}</strong> reviews</span></div></>}
      </section>

      {caseSummary&&<section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:14}}><div><h2 style={{margin:"0 0 6px"}}>Authoritative SPT evidence</h2><p style={{margin:0,color:"#66717b",maxWidth:780}}>This is the evidence trail used by the server-controlled substantial-presence assessment. Scenario inputs below cannot change it.</p></div><a href={caseSummary.dayEvidenceProvenance.ledgerHref} style={{textDecoration:"none",border:"1px solid #cfd6dc",padding:"8px 11px",borderRadius:8,color:"inherit",fontWeight:700}}>Open day ledger</a></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
          {[
            ["Ledger entries",String(caseSummary.dayEvidenceProvenance.totalEntries)],
            ["Verified evidence",String(caseSummary.dayEvidenceProvenance.verifiedEntries)],
            ["Pending evidence",String(caseSummary.dayEvidenceProvenance.pendingEntries)],
            ["Current-year physical days",String(caseSummary.dayEvidenceProvenance.currentYearPhysicalDays)],
            ["Prior-year physical days",String(caseSummary.dayEvidenceProvenance.priorYearPhysicalDays)],
            ["Second-prior-year physical days",String(caseSummary.dayEvidenceProvenance.secondPriorYearPhysicalDays)],
          ].map(([label,value])=><div key={label} style={{padding:12,border:"1px solid #e1e6ea",borderRadius:9,background:"#fbfcfd"}}><small style={{color:"#717b85"}}>{label}</small><strong style={{display:"block",marginTop:4}}>{value}</strong></div>)}
        </div>
        <div style={{marginTop:12,padding:12,borderRadius:9,background:"#f8fafb",color:"#5f6872",fontSize:13}}>Authoritative SPT: <strong>{caseSummary.substantialPresenceStatus.replaceAll("_"," ")}</strong> · Rule <strong>{caseSummary.dayEvidenceProvenance.substantialPresenceRuleVersion}</strong> · Source <strong>{caseSummary.dayEvidenceProvenance.source.replaceAll("-"," ")}</strong></div>
      </section>}

      {caseSummary&&<section style={{background:"#fffaf0",border:"1px solid #eadfc6",borderRadius:12,padding:18,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{maxWidth:820}}><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".08em",fontWeight:800,color:"#8a5a00"}}>Authoritative action required</div><h2 style={{margin:"6px 0"}}>U.S. host-state evidence is incomplete</h2><p style={{margin:"0 0 10px",color:"#66552f"}}>{caseSummary.hostStateEvidence.blockingReason}</p><p style={{margin:0,color:"#66552f"}}><strong>Next safe action:</strong> {caseSummary.hostStateEvidence.nextAction}</p><p style={{margin:"10px 0 0",fontSize:12,color:"#76694d"}}>Evidence progress: <strong>{caseSummary.hostStateEvidence.verifiedEvidenceItems} of {caseSummary.hostStateEvidence.totalEvidenceItems}</strong> verified · State-tax assessment: <strong>{caseSummary.hostStateEvidence.stateTaxAssessmentAllowed?"Allowed":"Blocked"}</strong></p></div>
          <a href={caseSummary.hostStateEvidence.evidenceHref} style={{textDecoration:"none",border:"1px solid #c8a767",background:"white",padding:"9px 12px",borderRadius:8,color:"inherit",fontWeight:800}}>Review host-state evidence</a>
        </div>
      </section>}

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginBottom:18}}>
        {[["Employee","NVL-017 · Aditi Joshi"],["Home","Bengaluru, Karnataka"],["Assignment","24-month long-term"],["Policy","Tax equalization"],["Home payroll","Assessment required"],["Host payroll","Assessment required"]].map(([label,value])=><article key={label} style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:15}}><div style={{fontSize:12,color:"#737d87"}}>{label}</div><strong style={{display:"block",marginTop:5}}>{value}</strong></article>)}
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:14}}><div><h2 style={{margin:"0 0 6px"}}>Mobility case workstreams</h2><p style={{margin:0,color:"#66717b"}}>These cards are rendered from the same authoritative case summary that controls readiness and payroll activation.</p></div><span style={{padding:"6px 9px",borderRadius:999,background:"#fff3d8",fontSize:12,fontWeight:700}}>{caseSummary ? `${caseSummary.blockers} blockers · ${caseSummary.openReviews} reviews` : "Loading case state"}</span></div>
        {caseSummary ? <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
          {caseSummary.workstreams.map(item=>{
            const content = <><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"}}><strong>{item.label}</strong><span style={{fontSize:11,padding:"4px 7px",borderRadius:999,background:item.status==="READY"?"#e9f6ef":item.status==="BLOCKED"?"#ffe8e3":"#fff3d8"}}>{item.status.replaceAll("_"," ")}</span></div><p style={{margin:"8px 0 0",fontSize:13,color:"#66717b",lineHeight:1.45}}>{workstreamDetails[item.id] ?? "Controlled by the unified mobility case state."}</p></>;
            return item.href ? <a key={item.id} href={item.href} style={{display:"block",padding:14,border:"1px solid #dce2e7",borderRadius:10,textDecoration:"none",color:"inherit",background:"#fbfcfd"}}>{content}</a> : <div key={item.id} style={{padding:14,border:"1px solid #dce2e7",borderRadius:10,background:"#fbfcfd"}}>{content}</div>;
          })}
        </div> : <div style={{padding:14,border:"1px solid #dce2e7",borderRadius:10,background:"#fbfcfd",color:"#66717b"}}>{caseSummaryError ? "Authoritative workstream state unavailable. Treat payroll activation as blocked." : "Loading authoritative workstreams…"}</div>}
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:12}}><div><h2 style={{margin:"0 0 6px"}}>Assignment facts scenario sandbox</h2><p style={{margin:0,color:"#66717b",maxWidth:780}}>Editable values below are for scenario exploration only. They do not update the authoritative mobility case, readiness gates, payroll activation, or verified case evidence.</p></div><span style={{padding:"6px 9px",borderRadius:999,background:"#eef2f5",fontSize:12,fontWeight:700}}>Non-authoritative</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          <label><small>Scenario U.S. host state</small><input value={hostState} onChange={e=>setHostState(e.target.value)} placeholder="Scenario only, e.g. California" style={input}/></label>
          <label><small>Scenario monthly housing allowance (INR)</small><input type="number" min="0" value={housing} onChange={e=>setHousing(Number(e.target.value))} style={input}/></label>
          <label><small>Scenario monthly mobility allowance (INR)</small><input type="number" min="0" value={mobilityAllowance} onChange={e=>setMobilityAllowance(Number(e.target.value))} style={input}/></label>
        </div>
        <div style={{marginTop:14,padding:14,background:"#f8fafb",borderRadius:9}}><strong>Scenario compensation view</strong><div style={{marginTop:6,color:"#5f6872"}}>India monthly gross {cash.format(monthlyIndiaGross)} + scenario assignment allowances = <strong>{cash.format(monthlyAssignmentComp)}</strong>. This does not alter authoritative compensation or assume tax treatment by jurisdiction.</div></div>
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}><div><h2 style={{margin:"0 0 6px"}}>U.S. substantial presence scenario sandbox</h2><p style={{margin:0,color:"#66717b",maxWidth:760}}>Enter scenario physical-presence days to exercise the deterministic SPT rule. These inputs do not replace the evidence-backed day ledger or authoritative case SPT status.</p></div><span style={{padding:"6px 9px",borderRadius:999,background:spt.status==="MEETS_SPT"?"#fff3d8":"#e9f6ef",fontSize:12,fontWeight:700}}>Scenario: {spt.status.replaceAll("_"," ")}</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginTop:14}}>
          <label><small>Scenario current-year days</small><input type="number" min="0" max="366" value={currentDays} onChange={e=>setCurrentDays(Number(e.target.value))} style={input}/></label>
          <label><small>Scenario prior-year days</small><input type="number" min="0" max="366" value={priorDays} onChange={e=>setPriorDays(Number(e.target.value))} style={input}/></label>
          <label><small>Scenario second-prior-year days</small><input type="number" min="0" max="366" value={secondPriorDays} onChange={e=>setSecondPriorDays(Number(e.target.value))} style={input}/></label>
          <label><small>Scenario excluded current-year days</small><input type="number" min="0" max="366" value={excludedDays} onChange={e=>setExcludedDays(Number(e.target.value))} style={input}/></label>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginTop:14}}>
          {[["Counted current year",String(spt.currentYearCountedDays)],["Weighted 3-year days",String(spt.weightedDays)],["31-day test",spt.currentYear31DayTest?"Pass":"Not met"],["183 weighted-day test",spt.threeYear183DayTest?"Pass":"Not met"],["Rule version",spt.ruleVersion]].map(([label,value])=><div key={label} style={{padding:12,border:"1px solid #e1e6ea",borderRadius:9}}><small style={{color:"#717b85"}}>{label}</small><strong style={{display:"block",marginTop:4}}>{value}</strong></div>)}
        </div>
        <p style={{fontSize:12,color:"#737d87",marginBottom:0}}>This scenario result is a federal tax-residency fact assessment only. It does not update the authoritative case. Closer-connection, treaty, green-card and other legal/tax positions remain separate review objects.</p>
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18}}>
        <h2 style={{marginTop:0}}>Mobility Guardian</h2>
        <div style={{display:"grid",gap:9}}>{guardian.map((item,i)=><div key={i} style={{padding:12,border:"1px solid #eadfc6",background:"#fffaf0",borderRadius:9}}>{item}</div>)}</div>
      </section>
    </div>
  </main>;
}

const input: React.CSSProperties = {width:"100%",boxSizing:"border-box",marginTop:6,padding:"10px 11px",border:"1px solid #cfd6dc",borderRadius:8,fontSize:15,background:"white"};