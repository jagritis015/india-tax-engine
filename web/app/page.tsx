"use client";

import { Bot, Check, ChevronRight, CircleHelp, Download, FileText, Globe2, IndianRupee, LayoutDashboard, LockKeyhole, Menu, Search, Send, ShieldCheck, Sparkles, TriangleAlert, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { UAT_COMPANY, UAT_EMPLOYEES, type UatEmployee } from "../lib/uat-niva-data";
import { answerPayrollCopilot } from "../lib/uat-payroll-copilot";

type View = "overview" | "payroll" | "employees" | "mobility" | "compliance" | "reports";
type Issue = { id:number; employee:string; employeeId:string; issue:string; severity:"High"|"Blocker"|"Medium"; value:string; resolved:boolean };
type Employee = UatEmployee;
type Remediation = { workState:string; correctedGross:string; confirmed:boolean };
type CopilotMessage = { role:"user"|"copilot"; text:string };

const cash = new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
const nav = [
  {id:"overview",label:"Overview",icon:LayoutDashboard},
  {id:"payroll",label:"Payroll runs",icon:IndianRupee},
  {id:"employees",label:"Employees",icon:Users},
  {id:"mobility",label:"Global mobility",icon:Globe2},
  {id:"compliance",label:"Compliance",icon:ShieldCheck},
  {id:"reports",label:"Reports",icon:FileText},
] as const;

const initialIssues: Issue[] = [
  {id:1,employee:"Aditi Joshi",employeeId:"NVL-017",issue:"Payroll input requires review",severity:"High",value:"Review",resolved:false},
  {id:2,employee:"Pooja Sharma",employeeId:"NVL-042",issue:"Professional Tax work location requires review",severity:"Blocker",value:"Blocked",resolved:false},
  {id:3,employee:"Kiran Verma",employeeId:"NVL-063",issue:"Payroll input requires review",severity:"Medium",value:"Review",resolved:false},
];

export default function Home(){
  const [view,setView]=useState<View>("overview");
  const [menu,setMenu]=useState(false);
  const [assistant,setAssistant]=useState(true);
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState<Issue|null>(null);
  const [remediation,setRemediation]=useState<Remediation>({workState:"",correctedGross:"",confirmed:false});
  const [toast,setToast]=useState("");
  const [status,setStatus]=useState("Draft");
  const [people,setPeople]=useState<Employee[]>(UAT_EMPLOYEES);
  const [adding,setAdding]=useState(false);
  const [employeeDraft,setEmployeeDraft]=useState({name:"",id:"",role:"",gross:""});
  const [issues,setIssues]=useState<Issue[]>(initialIssues);
  const [copilotInput,setCopilotInput]=useState("");
  const [copilotMessages,setCopilotMessages]=useState<CopilotMessage[]>([
    {role:"copilot",text:"Ask me about the September payroll, review items, statutory controls, or Aditi Joshi's mobility case."},
  ]);
  const copilotEndRef=useRef<HTMLDivElement|null>(null);

  const open=issues.filter(x=>!x.resolved).length;
  const filtered=useMemo(()=>people.filter(p=>`${p.name} ${p.id} ${p.role}`.toLowerCase().includes(query.toLowerCase())),[query,people]);
  useEffect(()=>{copilotEndRef.current?.scrollIntoView({behavior:"smooth",block:"nearest"})},[copilotMessages]);
  const notify=(text:string)=>{setToast(text);window.setTimeout(()=>setToast(""),2400)};
  const go=(next:View)=>{setView(next);setMenu(false);window.scrollTo({top:0,behavior:"smooth"})};
  const openIssue=(issue:Issue)=>{const employee=people.find(p=>p.id===issue.employeeId);setSelected(issue);setRemediation({workState:"",correctedGross:employee?String(employee.gross):"",confirmed:false})};
  const closeIssue=()=>{setSelected(null);setRemediation({workState:"",correctedGross:"",confirmed:false})};
  const canResolve=!!selected && (selected.severity==="Blocker" ? remediation.workState.trim().length>0 && remediation.confirmed : Number(remediation.correctedGross)>0 && remediation.confirmed);
  const resolve=()=>{
    if(!selected||!canResolve)return;
    if(selected.severity==="Blocker" && remediation.workState.trim().toLowerCase()!=="karnataka"){
      notify("This UAT calculation path currently supports Karnataka PT only. Use a supported state or keep the exception open.");
      return;
    }
    if(selected.severity!=="Blocker"){
      const gross=Number(remediation.correctedGross);
      if(!Number.isFinite(gross)||gross<=0){notify("Enter a valid corrected monthly gross before resolving.");return}
      setPeople(xs=>xs.map(p=>p.id===selected.employeeId?{...p,gross,status:"Ready"}:p));
    } else {
      setPeople(xs=>xs.map(p=>p.id===selected.employeeId?{...p,status:"Ready"}:p));
    }
    setIssues(xs=>xs.map(x=>x.id===selected.id?{...x,resolved:true,value:"Cleared"}:x));
    closeIssue();
    notify("Exception resolved after required remediation was completed.");
  };
  const submit=()=>{if(open){notify(`Resolve ${open} exception${open===1?"":"s"} first.`);return}setStatus("Submitted");notify("Payroll submitted for approval in this UAT session.")};
  const ask=(prompt:string)=>{
    const message=prompt.trim();
    if(!message)return;
    const response=answerPayrollCopilot(message,{
      employeeCount:people.length,
      openIssues:issues.filter(issue=>!issue.resolved),
      payrollStatus:status,
    });
    setCopilotMessages(history=>[...history,{role:"user",text:message},{role:"copilot",text:response}].slice(-9));
    setCopilotInput("");
    setAssistant(true);
  };
  const download=(name:string)=>{const csv="Employee ID,Employee,Gross Pay,Status\n"+people.map(p=>`${p.id},${p.name},${p.gross},${p.status}`).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`${name.toLowerCase().replaceAll(" ","-")}-sep-2026.csv`;a.click();URL.revokeObjectURL(a.href);notify(`${name} downloaded.`)};
  const addEmployee=(e:React.FormEvent)=>{e.preventDefault();const name=employeeDraft.name.trim(),id=employeeDraft.id.trim().toUpperCase(),role=employeeDraft.role.trim(),gross=Number(employeeDraft.gross);if(!name||!id||!role||!Number.isFinite(gross)||gross<=0){notify("Complete all employee fields with a valid monthly gross.");return}if(people.some(p=>p.id.toLowerCase()===id.toLowerCase())){notify("Employee ID already exists in this UAT workspace.");return}setPeople(xs=>[{name,id,role,gross,status:"Needs review"},...xs]);setEmployeeDraft({name:"",id:"",role:"",gross:""});setAdding(false);notify(`${name} added to this browser UAT session.`)};

  return <main className="product-shell">
    <aside className={`sidebar ${menu?"mobile-open":""}`}>
      <div className="brand"><span className="brand-mark">प</span><span>Payroll OS</span><button className="close-nav" onClick={()=>setMenu(false)} aria-label="Close"><X/></button></div>
      <div className="company-switch"><span className="company-logo">NL</span><span><strong>{UAT_COMPANY.name}</strong><small>{UAT_COMPANY.period}</small></span></div>
      <nav>{nav.map(({id,label,icon:Icon})=><button key={id} className={`nav-item ${view===id?"active":""}`} onClick={()=>go(id)}><Icon/>{label}</button>)}</nav>
      <div className="sidebar-foot"><LockKeyhole/>Synthetic founder UAT</div>
    </aside>
    {menu&&<button className="nav-backdrop" onClick={()=>setMenu(false)} aria-label="Close navigation"/>}
    <section className="workspace">
      <header className="topbar"><div><button className="mobile-menu" onClick={()=>setMenu(true)} aria-label="Open navigation"><Menu/></button><span className="eyebrow">Niva Labs payroll workspace</span></div><div className="top-actions"><button className="icon-button" onClick={()=>notify("Help centre is planned for secure UAT.")}><CircleHelp/></button><span className="avatar">AS</span></div></header>
      <div className="content">
        {view==="overview"&&<Overview issues={issues} open={open} status={status} go={go} select={openIssue} assistant={assistant} setAssistant={setAssistant} messages={copilotMessages} copilotEndRef={copilotEndRef} copilotInput={copilotInput} setCopilotInput={setCopilotInput} ask={ask} employeeCount={people.length}/>}
        {view==="payroll"&&<Payroll issues={issues} open={open} status={status} select={openIssue} submit={submit} employeeCount={people.length}/>}
        {view==="employees"&&<Employees people={filtered} total={people.length} query={query} setQuery={setQuery} add={()=>setAdding(true)}/>} 
        {view==="mobility"&&<Mobility/>}
        {view==="compliance"&&<Compliance notify={notify}/>} 
        {view==="reports"&&<Reports download={download}/>} 
      </div>
    </section>

    {selected&&<div className="modal-backdrop" onMouseDown={closeIssue}><section className="modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><span className="section-label">Payroll exception</span><h2>{selected.employee}</h2><small>{selected.employeeId}</small></div><button className="icon-button" onClick={closeIssue}><X/></button></div><span className={`issue-pill ${selected.severity.toLowerCase()}`}>{selected.severity}</span><h3>{selected.issue}</h3>{selected.severity==="Blocker"?<><p>Verify the employee work state before resolving this Professional Tax blocker. Closing this dialog does not clear the exception.</p><label><small>Verified work state</small><input aria-label="Verified work state" value={remediation.workState} onChange={e=>setRemediation(x=>({...x,workState:e.target.value}))} placeholder="Karnataka" style={{width:"100%",marginTop:6,padding:11,border:"1px solid var(--input)",borderRadius:9}}/></label></>:<><p>Correct the payroll input before resolving this exception. Closing this dialog does not clear it.</p><label><small>Corrected monthly gross</small><input aria-label="Corrected monthly gross" type="number" min="1" value={remediation.correctedGross} onChange={e=>setRemediation(x=>({...x,correctedGross:e.target.value}))} style={{width:"100%",marginTop:6,padding:11,border:"1px solid var(--input)",borderRadius:9}}/></label></>}<label style={{display:"flex",gap:10,alignItems:"flex-start",marginTop:16}}><input type="checkbox" checked={remediation.confirmed} onChange={e=>setRemediation(x=>({...x,confirmed:e.target.checked}))}/><span><strong>I verified the source data</strong><small style={{display:"block",marginTop:3}}>This confirmation is required before the exception can be cleared.</small></span></label><div className="modal-actions"><button className="secondary-action" onClick={closeIssue}>Cancel</button><button className="primary-action" onClick={resolve} disabled={!canResolve} aria-disabled={!canResolve}><Check/>Resolve after validation</button></div></section></div>}

    {adding&&<div className="modal-backdrop" onMouseDown={()=>setAdding(false)}><form className="modal" role="dialog" aria-modal="true" onSubmit={addEmployee} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><span className="section-label">Synthetic UAT record</span><h2>Add employee</h2></div><button type="button" className="icon-button" onClick={()=>setAdding(false)}><X/></button></div><p>Add a test employee to this browser session. The record resets on reload and is not written to production data.</p><div style={{display:"grid",gap:12}}><label><small>Full name</small><input aria-label="Full name" value={employeeDraft.name} onChange={e=>setEmployeeDraft(x=>({...x,name:e.target.value}))} placeholder="e.g. Ananya Rao" style={{width:"100%",marginTop:6,padding:11,border:"1px solid var(--input)",borderRadius:9}}/></label><label><small>Employee ID</small><input aria-label="Employee ID" value={employeeDraft.id} onChange={e=>setEmployeeDraft(x=>({...x,id:e.target.value}))} placeholder="e.g. NVL-101" style={{width:"100%",marginTop:6,padding:11,border:"1px solid var(--input)",borderRadius:9}}/></label><label><small>Role</small><input aria-label="Role" value={employeeDraft.role} onChange={e=>setEmployeeDraft(x=>({...x,role:e.target.value}))} placeholder="e.g. Product Manager" style={{width:"100%",marginTop:6,padding:11,border:"1px solid var(--input)",borderRadius:9}}/></label><label><small>Monthly gross</small><input aria-label="Monthly gross" type="number" min="1" value={employeeDraft.gross} onChange={e=>setEmployeeDraft(x=>({...x,gross:e.target.value}))} placeholder="150000" style={{width:"100%",marginTop:6,padding:11,border:"1px solid var(--input)",borderRadius:9}}/></label></div><div className="modal-actions"><button type="button" className="secondary-action" onClick={()=>setAdding(false)}>Cancel</button><button className="primary-action" type="submit"><Check/>Add employee</button></div></form></div>}
    {toast&&<div className="toast" role="status"><Check/>{toast}</div>}
  </main>
}

function Title({title,copy,action}:{title:string;copy:string;action?:React.ReactNode}){return <div className="title-row"><div><h1>{title}</h1><p>{copy}</p></div>{action}</div>}
function Progress({open,status,employeeCount}:{open:number;status:string;employeeCount:number}){const ready=open===0;return <section className="run-panel"><div className="panel-heading"><div><span className="section-label">Current run</span><h2>Monthly payroll · Sep 2026</h2></div><span className={`status-badge ${status==="Submitted"?"submitted":""}`}>{status}</span></div><div className="run-progress"><Step n="1" name="Inputs" note={`${employeeCount} employees`} state="complete"/><Line done/><Step n="2" name="Validation" note={`${open} exceptions`} state={ready?"complete":"current"}/><Line done={ready}/><Step n="3" name="Approval" note={status==="Submitted"?"Submitted":"Not submitted"} state={ready?"current":""}/><Line done={status==="Submitted"}/><Step n="4" name="Finalize" note="Outputs locked" state=""/></div></section>}
function Step({n,name,note,state}:{n:string;name:string;note:string;state:string}){return <div className={`progress-step ${state}`}><span>{n}</span><strong>{name}</strong><small>{note}</small></div>}
function Line({done=false}:{done?:boolean}){return <div className={`progress-line ${done?"complete":""}`}/>}
function IssueList({issues,select,all}:{issues:Issue[];select:(x:Issue)=>void;all?:()=>void}){return <div className="exceptions-panel"><div className="panel-heading"><div><span className="section-label">Needs attention</span><h2>Payroll exceptions</h2></div>{all&&<button className="text-action" onClick={all}>View all</button>}</div><div className="exception-list">{issues.map(x=><button className={`exception-row ${x.resolved?"resolved":""}`} key={x.id} onClick={()=>!x.resolved&&select(x)}><span className={`severity ${x.resolved?"done":x.severity.toLowerCase()}`}>{x.resolved?<Check/>:<TriangleAlert/>}</span><span className="exception-copy"><strong>{x.employee}</strong><small>{x.resolved?"Resolved after remediation":`${x.employeeId} · ${x.issue}`}</small></span><span className="exception-value">{x.resolved?"Cleared":x.value}</span><ChevronRight/></button>)}</div></div>}
function Overview({issues,open,status,go,select,assistant,setAssistant,messages,copilotEndRef,copilotInput,setCopilotInput,ask,employeeCount}:any){const stats=[{label:"Employees",value:String(employeeCount),note:`${employeeCount-open} ready · ${open} need review`},{label:"Gross payroll",value:cash.format(UAT_COMPANY.grossPayroll),note:"Representative UAT baseline"},{label:"Net payable",value:cash.format(UAT_COMPANY.netPayable),note:"Representative UAT baseline"},{label:"Employer cost",value:cash.format(UAT_COMPANY.employerCost),note:"Representative UAT baseline"}];return <><Title title="September payroll" copy={`${UAT_COMPANY.name} · Review the draft, resolve exceptions and submit it for approval.`} action={<button className="primary-action" onClick={()=>go("payroll")}>Review payroll <ChevronRight/></button>}/><div className="uat-notice"><ShieldCheck/><span><strong>Niva Labs synthetic founder UAT</strong>100 employee baseline. Statutory calculations remain server controlled and unsupported rules fail closed.</span></div><section className="stat-grid">{stats.map(x=><article className="stat-card" key={x.label}><div className="stat-head"><span>{x.label}</span></div><strong>{x.value}</strong><small>{x.note}</small></article>)}</section><section className="mobility-progress"><div className="mobility-progress-copy"><div className="mobility-progress-label"><span>New in UAT</span><small>Shipped 12 Sep 2026</small></div><Globe2/><div><strong>India to United States mobility control</strong><h2>Aditi Joshi · Assignment readiness</h2><p>The corridor now joins location evidence, compensation, India hypothetical tax and activation controls in one reviewable case.</p></div></div><div className="mobility-progress-metrics"><span><strong>2</strong><small>Blockers</small></span><span><strong>4</strong><small>Reviews</small></span><span><strong>Blocked</strong><small>Payroll activation</small></span></div><div className="mobility-progress-actions"><button className="secondary-action" onClick={()=>go("mobility")}>View mobility workspace</button><a className="primary-action" href="/uat/mobility/aditi-india-us/readiness">Open readiness control <ChevronRight/></a></div></section><Progress open={open} status={status} employeeCount={employeeCount}/><section className="lower-grid"><IssueList issues={issues} select={select} all={()=>go("payroll")}/><div className="copilot-panel"><div className="copilot-head"><span><Sparkles/>Payroll Copilot</span><button onClick={()=>setAssistant(!assistant)}>{assistant?"Hide":"Open"}</button></div>{assistant&&<div className="copilot-body"><div className="copilot-mode"><span>Interactive UAT</span><small>Zero-cost deterministic mode</small></div><div className="copilot-transcript" aria-live="polite">{messages.map((message:CopilotMessage,index:number)=><div className={`copilot-message ${message.role}`} key={`${message.role}-${index}`}>{message.role==="copilot"&&<Bot/>}<div><small>{message.role==="copilot"?"Copilot":"You"}</small><p>{message.text}</p></div></div>)}<div ref={copilotEndRef}/></div><div className="quick-actions">{["Explain review items","Show blocking issues","Summarize September"].map(x=><button key={x} onClick={()=>ask(x)}>{x}</button>)}</div><form className="prompt-box" onSubmit={(event:React.FormEvent)=>{event.preventDefault();ask(copilotInput)}}><input aria-label="Ask Payroll Copilot" value={copilotInput} onChange={(event:React.ChangeEvent<HTMLInputElement>)=>setCopilotInput(event.target.value)} placeholder="Ask about payroll or mobility"/><button type="submit" disabled={!copilotInput.trim()} aria-label="Send question"><Send/></button></form><small className="ai-note"><LockKeyhole/>No paid AI is connected. Answers use current synthetic UAT state and never calculate statutory money.</small></div>}</div></section></>}
function Payroll({issues,open,status,select,submit,employeeCount}:any){return <><Title title="Payroll runs" copy={`Validate ${UAT_COMPANY.name}'s September payroll and move it through controlled approval.`} action={<button className="primary-action" onClick={submit}>{status==="Submitted"?<><Check/>Submitted</>:<>Submit for approval <ChevronRight/></>}</button>}/><div className="summary-strip"><span><strong>Sep 2026</strong><small>Monthly · {employeeCount} employees</small></span><span><strong>{cash.format(UAT_COMPANY.grossPayroll)}</strong><small>Gross payroll</small></span><span><strong>{open}</strong><small>Open exceptions</small></span><span><strong>{status}</strong><small>Run status</small></span></div><Progress open={open} status={status} employeeCount={employeeCount}/><div className="full-panel"><IssueList issues={issues} select={select}/></div></>}
function Employees({people,total,query,setQuery,add}:any){return <><Title title="Employees" copy={`${UAT_COMPANY.name} · Review payroll readiness and compensation inputs.`} action={<button className="primary-action" onClick={add}>Add employee</button>}/><div className="toolbar"><label className="search-box"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, ID or role"/></label><span>{total} employees in this UAT session</span></div><div className="table-card"><table><thead><tr><th>Employee</th><th>Role</th><th>Monthly gross</th><th>Payroll status</th></tr></thead><tbody>{people.map((p:Employee)=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.id}</small></td><td>{p.role}</td><td>{cash.format(p.gross)}</td><td><span className={`employee-status ${p.status.toLowerCase().replace(" ","-")}`}>{p.status}</span></td></tr>)}</tbody></table>{!people.length&&<div className="empty-state">No employees match your search.</div>}</div></>}
function Mobility(){const controls=[{title:"Assignment readiness",status:"Blocked",copy:"Two activation blockers and four evidence reviews remain open."},{title:"India hypothetical tax",status:"Ready",copy:"Policy tax is calculable through the deterministic India engine."},{title:"Location evidence",status:"Review",copy:"The auditable day ledger contains one pending evidence item."},{title:"US monetary tax",status:"Blocked",copy:"Federal, state and local monetary engines remain fail closed."}];return <><Title title="Global mobility" copy="Operate the India to United States corridor from evidence-backed, reviewable controls." action={<a className="primary-action" style={{textDecoration:"none"}} href="/uat/mobility/aditi-india-us">Open mobility case <ChevronRight/></a>}/><div className="uat-notice"><Globe2/><span><strong>India to United States founder UAT</strong>Aditi Joshi is the first connected mobility case. Payroll activation remains blocked until every required gate is verified.</span></div><div className="summary-strip"><span><strong>1</strong><small>Active corridor case</small></span><span><strong>2</strong><small>Activation blockers</small></span><span><strong>4</strong><small>Evidence reviews</small></span><span><strong>Off</strong><small>Paid AI services</small></span></div><div className="compliance-grid">{controls.map(control=><article className="compliance-card" key={control.title}><div><ShieldCheck/><span className={`employee-status ${control.status.toLowerCase()}`}>{control.status}</span></div><h2>{control.title}</h2><p>{control.copy}</p>{control.title==="Assignment readiness"&&<a className="secondary-action" style={{textDecoration:"none",marginTop:12}} href="/uat/mobility/aditi-india-us/readiness">Review activation gates <ChevronRight/></a>}</article>)}</div></>}
function Compliance({notify}:any){const rows=[{title:"Provident Fund",due:"Rule audit ongoing",status:"Review",copy:"Production-completeness audit is still required before PF coverage is represented as verified."},{title:"ESI contribution",due:"Coverage review",status:"Review",copy:"No eligibility count is asserted in this UAT shell until deterministic coverage is verified."},{title:"Professional Tax",due:"Location review",status:"Blocked",copy:"NVL-042 requires work-location review. State PT coverage remains subject to rule-by-rule verification."},{title:"Salary TDS",due:"TY 2026-27",status:"Ready",copy:"Verified salary-chain rules are deterministic and unsupported inputs fail closed."}];return <><Title title="Compliance" copy="Track statutory readiness without overstating unsupported coverage."/><div className="compliance-grid">{rows.map(x=><article className="compliance-card" key={x.title}><div><ShieldCheck/><span className={`employee-status ${x.status.toLowerCase()}`}>{x.status}</span></div><h2>{x.title}</h2><p>{x.copy}</p><small>{x.due}</small><button className="secondary-action" onClick={()=>notify(`${x.title} detail opened for synthetic UAT data.`)}>Review details <ChevronRight/></button></article>)}</div></>}
function Reports({download}:any){const rows=["Payroll register","Bank advice","TDS deduction register","Variance report"];return <><Title title="Reports" copy={`Generate controlled outputs from ${UAT_COMPANY.name}'s September UAT payroll.`}/><div className="report-list">{rows.map(x=><article className="report-row" key={x}><span className="report-icon"><FileText/></span><span><strong>{x}</strong><small>Niva Labs synthetic September 2026 UAT output</small></span><span className="file-tag">CSV</span><button className="secondary-action" onClick={()=>download(x)}><Download/>Download</button></article>)}</div><div className="security-note"><LockKeyhole/><span><strong>Synthetic UAT output only</strong><small>Downloads are not statutory filings or bank instructions.</small></span></div></>}
