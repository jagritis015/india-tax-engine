import { ADITI_INDIA_US_LEDGER, summarizeCompensationLedger } from "../../../../../lib/uat-global-compensation-ledger";

const inr = new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 });

export default function AditiCompensationLedgerPage(){
  const summary = summarizeCompensationLedger(ADITI_INDIA_US_LEDGER);
  return <main style={{minHeight:"100vh",background:"#f6f8fa",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif",color:"#18212b"}}>
    <div style={{maxWidth:1120,margin:"0 auto",padding:"28px 18px 64px"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
        <div><div style={{fontSize:13,color:"#6b7480",marginBottom:6}}>India → U.S. mobility · Compensation</div><h1 style={{margin:"0 0 8px",fontSize:32}}>Aditi Joshi · Global compensation ledger</h1><p style={{margin:0,color:"#5d6772",maxWidth:760}}>One compensation truth across home payroll, host payroll, hypothetical tax and future shadow-payroll assessment. Unsupported jurisdiction treatment remains review-required.</p></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><a href="/uat/mobility/aditi-india-us/readiness#resolution-compensation-treatment" style={{textDecoration:"none",color:"white",border:"1px solid #173b32",background:"#173b32",padding:"10px 13px",borderRadius:9,fontWeight:800}}>Answer treatment reviews</a><a href="/uat/mobility/aditi-india-us" style={{textDecoration:"none",color:"inherit",border:"1px solid #cfd6dc",background:"white",padding:"10px 13px",borderRadius:9}}>Back to mobility case</a></div>
      </header>

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginBottom:18}}>
        {[["Monthly tracked compensation",inr.format(summary.monthlyInr)],["Included in India hypo",inr.format(summary.hypoMonthlyInr)],["Items needing treatment review",String(summary.unresolved)]].map(([label,value])=><article key={label} style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,padding:15}}><div style={{fontSize:12,color:"#737d87"}}>{label}</div><strong style={{display:"block",marginTop:5,fontSize:20}}>{value}</strong></article>)}
      </section>

      <section style={{background:"white",border:"1px solid #dde3e8",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:18,borderBottom:"1px solid #e7ebee"}}><h2 style={{margin:0}}>Ledger items</h2><p style={{margin:"6px 0 0",color:"#68727c"}}>Tax/payroll treatment is explicit per item instead of being hidden inside a single assignment-cost number.</p></div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}><thead><tr>{["Component","Amount","Payer","Jurisdiction","Treatment","India hypo policy","Evidence"].map(x=><th key={x} style={{textAlign:"left",fontSize:12,color:"#6f7983",padding:"11px 14px",background:"#fafbfc",borderBottom:"1px solid #e7ebee"}}>{x}</th>)}</tr></thead><tbody>{ADITI_INDIA_US_LEDGER.map(item=><tr key={item.id}><td style={cell}><strong>{item.label}</strong><div style={{fontSize:12,color:"#78818a"}}>{item.frequency}</div></td><td style={cell}>{item.currency==="INR"?inr.format(item.amount):`${item.currency} ${item.amount.toLocaleString()}`}</td><td style={cell}>{item.payer}</td><td style={cell}>{item.jurisdiction}</td><td style={cell}>{item.treatment}</td><td style={cell}>{item.policyIncludedInHypo?"Included":"Excluded"}</td><td style={cell}>{item.evidenceStatus}</td></tr>)}</tbody></table></div>
      </section>

      <section style={{marginTop:18,padding:16,background:"#fff8e8",border:"1px solid #ead8ad",borderRadius:12}}><strong>Fail-closed behavior</strong><div style={{marginTop:6,color:"#5f6872"}}>Housing and mobility allowances are tracked, but U.S. federal/state taxability and payroll treatment are not guessed. They remain review-required until the relevant jurisdiction rules and evidence are verified.</div><a href="/uat/mobility/aditi-india-us/readiness#resolution-compensation-treatment" style={{display:"inline-block",marginTop:10,fontWeight:800,color:"#755000"}}>Record reviewed treatments →</a></section>
    </div>
  </main>;
}
const cell: React.CSSProperties = {padding:"12px 14px",borderBottom:"1px solid #edf0f2",verticalAlign:"top"};
