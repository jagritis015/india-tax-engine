import { assessAditiIndiaUsReadiness } from "../../../../../lib/uat-mobility-readiness";
import { MobilityResolutionWorkbench } from "../../../../../components/mobility-resolution-workbench";

export default function MobilityReadinessPage() {
  const snapshot = assessAditiIndiaUsReadiness();

  return <main style={{minHeight:"100vh",background:"#f6f8fa",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif",color:"#18212b"}}>
    <div style={{maxWidth:1180,margin:"0 auto",padding:"28px 18px 64px"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
        <div><div style={{fontSize:13,color:"#6b7480",marginBottom:6}}>India to United States mobility · Activation control</div><h1 style={{margin:"0 0 8px",fontSize:32}}>Aditi Joshi · Assignment readiness</h1><p style={{margin:0,color:"#5d6772",maxWidth:780}}>Answer every human-review blocker in the resolution workspace. Statutory calculations remain deterministic, and the unverified US monetary-tax engine stays fail closed.</p></div>
        <a href="/uat/mobility/aditi-india-us" style={{textDecoration:"none",color:"inherit",border:"1px solid #cfd6dc",background:"white",padding:"10px 13px",borderRadius:9}}>Back to mobility case</a>
      </header>

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:18}}>
        {[["Case",snapshot.caseId],["Status",snapshot.status],["Ready",String(snapshot.readyCount)],["Review required",String(snapshot.reviewCount)],["Blocked",String(snapshot.blockedCount)]].map(([label,value])=><article key={label} style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:15}}><div style={{fontSize:12,color:"#737d87"}}>{label}</div><strong style={{display:"block",marginTop:5}}>{value}</strong></article>)}
      </section>

      <section style={{padding:17,border:"1px solid #edc7bd",background:"#fff4f1",borderRadius:12,marginBottom:18}}><strong>Payroll activation blocked</strong><p style={{margin:"6px 0 0",color:"#6f4a42"}}>Human-review gates can now be answered below. Home, host, and shadow-payroll activation remain disabled until those reviews are resolved and a verified US monetary-tax engine is integrated.</p></section>

      <MobilityResolutionWorkbench />

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,overflow:"hidden",marginBottom:18}}>
        <div style={{padding:18,borderBottom:"1px solid #e6eaed"}}><h2 style={{margin:"0 0 5px"}}>Readiness gates · authoritative baseline</h2><p style={{margin:0,color:"#66717b"}}>This server-controlled baseline remains fail closed. Use the Answer link to complete its matching UAT review.</p></div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:980}}><thead><tr>{["Gate","Owner","Status","Decision detail","Evidence","Action"].map((heading)=><th key={heading} style={{textAlign:"left",padding:"11px 14px",fontSize:12,color:"#707a84",background:"#fafbfc",borderBottom:"1px solid #e6eaed"}}>{heading}</th>)}</tr></thead><tbody>{snapshot.gates.map((gate)=><tr key={gate.id}><td style={cell}><strong>{gate.label}</strong></td><td style={cell}>{gate.owner}</td><td style={cell}><span style={{display:"inline-block",padding:"5px 8px",borderRadius:999,fontSize:11,fontWeight:800,background:gate.status==="READY"?"#e9f6ef":gate.status==="BLOCKED"?"#ffe8e3":"#fff3d8",color:gate.status==="READY"?"#246a4c":gate.status==="BLOCKED"?"#9b3528":"#8a5a00"}}>{gate.status.replaceAll("_"," ")}</span></td><td style={cell}>{gate.detail}</td><td style={cell}>{gate.evidence}</td><td style={cell}>{gate.status==="READY"?<span style={{color:"#246a4c",fontWeight:800}}>Complete</span>:<a href={gate.id==="immigration"?"/uat/mobility/aditi-india-us/immigration":`#resolution-${gate.id}`} style={{fontWeight:800,color:"#17634f"}}>{gate.id==="us-tax-engine"?"View blocker":gate.id==="immigration"?"Open preflight":"Answer"}</a>}</td></tr>)}</tbody></table></div>
      </section>

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
        <article style={panel}><h2 style={{marginTop:0}}>Evidence summary</h2><div style={{display:"grid",gap:9}}>{[["Pending day evidence",snapshot.evidenceSummary.pendingDayEvidence],["Unresolved compensation items",snapshot.evidenceSummary.unresolvedCompensationItems],["SPT status",snapshot.evidenceSummary.substantialPresenceStatus],["India hypothetical tax",snapshot.evidenceSummary.indiaHypotheticalTaxStatus]].map(([label,value])=><div key={label} style={{display:"flex",justifyContent:"space-between",gap:12,paddingBottom:9,borderBottom:"1px solid #edf0f2"}}><span style={{color:"#66717b"}}>{label}</span><strong>{value}</strong></div>)}</div></article>
        <article style={panel}><h2 style={{marginTop:0}}>Next safe actions</h2><ol style={{marginBottom:0,paddingLeft:21,color:"#55616b",lineHeight:1.55}}>{snapshot.nextActions.map((action)=><li key={action} style={{marginTop:7}}>{action}</li>)}</ol></article>
      </section>

      <footer style={{marginTop:18,fontSize:12,color:"#78828c"}}>Decision model {snapshot.ruleVersion}. Representative founder UAT only.</footer>
    </div>
  </main>;
}

const cell: React.CSSProperties = {padding:"12px 14px",borderBottom:"1px solid #edf0f2",verticalAlign:"top",fontSize:13,lineHeight:1.45};
const panel: React.CSSProperties = {background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:18};
