import { ADITI_DAY_LEDGER, summarizeMobilityDayLedger } from "../../../../../lib/uat-mobility-day-ledger";

export default function AditiDayLedgerPage(){
  const summary = summarizeMobilityDayLedger(ADITI_DAY_LEDGER);
  return <main style={{minHeight:"100vh",background:"#f6f8fa",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif",color:"#18212b"}}>
    <div style={{maxWidth:1120,margin:"0 auto",padding:"28px 18px 64px"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
        <div><div style={{fontSize:13,color:"#6b7480",marginBottom:6}}>India → U.S. mobility · Presence evidence</div><h1 style={{margin:"0 0 8px",fontSize:32}}>Aditi Joshi · Workday & travel ledger</h1><p style={{margin:0,color:"#5d6772",maxWidth:760}}>Physical-presence evidence feeds the deterministic U.S. Substantial Presence Test. Pending evidence stays visible and does not become a hidden tax assumption.</p></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><a href="/uat/mobility/aditi-india-us/readiness#resolution-location-evidence" style={{textDecoration:"none",color:"white",border:"1px solid #173b32",background:"#173b32",padding:"10px 13px",borderRadius:9,fontWeight:800}}>Answer pending evidence</a><a href="/uat/mobility/aditi-india-us" style={{textDecoration:"none",color:"inherit",border:"1px solid #cfd6dc",background:"white",padding:"10px 13px",borderRadius:9}}>Back to mobility case</a></div>
      </header>

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:18}}>
        {[["2026 U.S. days",String(summary.current.physical)],["2025 U.S. days",String(summary.prior.physical)],["2024 U.S. days",String(summary.second.physical)],["Pending evidence",String(summary.pendingEvidence)],["Weighted SPT days",String(summary.spt.weightedDays)],["SPT status",summary.spt.status.replaceAll("_"," ")]].map(([label,value])=><article key={label} style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:15}}><div style={{fontSize:12,color:"#737d87"}}>{label}</div><strong style={{display:"block",marginTop:5,fontSize:19}}>{value}</strong></article>)}
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:18,borderBottom:"1px solid #e7ebee"}}><h2 style={{margin:0}}>Evidence ledger</h2><p style={{margin:"6px 0 0",color:"#68727c"}}>Each U.S. day keeps its source, classification and verification status. Links from the unified case jump directly to the first unresolved evidence record.</p></div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:850}}><thead><tr>{["Date","Country","Classification","Evidence","Status","Note"].map(x=><th key={x} style={{textAlign:"left",fontSize:12,color:"#6f7983",padding:"11px 14px",background:"#fafbfc",borderBottom:"1px solid #e7ebee"}}>{x}</th>)}</tr></thead><tbody>{ADITI_DAY_LEDGER.map(item=><tr id={`evidence-${item.id}`} key={item.id} style={item.evidenceStatus==="pending"?{background:"#fff8e8",scrollMarginTop:16}:undefined}><td style={cell}>{item.date}</td><td style={cell}>{item.country}</td><td style={cell}>{item.classification}</td><td style={cell}>{item.evidence}</td><td style={cell}><strong>{item.evidenceStatus}</strong></td><td style={cell}>{item.note}</td></tr>)}</tbody></table></div>
      </section>

      {summary.pendingEvidence>0 && <section style={{marginTop:18,padding:16,background:"#fff8e8",border:"1px solid #ead8ad",borderRadius:12}}><strong>Guardian finding</strong><div style={{marginTop:6,color:"#5f6872"}}>One or more physical-presence records are still pending corroboration. The day ledger remains auditable, and any residency position requiring verified evidence must remain review-required.</div><a href="/uat/mobility/aditi-india-us/readiness#resolution-location-evidence" style={{display:"inline-block",marginTop:10,fontWeight:800,color:"#755000"}}>Enter corroborating evidence →</a></section>}
    </div>
  </main>;
}
const cell: React.CSSProperties = {padding:"12px 14px",borderBottom:"1px solid #edf0f2",verticalAlign:"top"};
