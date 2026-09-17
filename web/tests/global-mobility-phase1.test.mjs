import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType:"custom", configFile:false, root, resolve:{alias:{"@":root}}, server:{middlewareMode:true} });
test.after(async()=>vite.close());

test("obligation revision and evaluation version remain separate", async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const caseRecord=m.MOBILITY_CASE_FIXTURES[0];
  const obligations=m.OBLIGATION_FIXTURES.filter(x=>x.caseId===caseRecord.caseId);
  const evaluation=m.evaluateMobilityReadiness(caseRecord,obligations,7);
  const current=obligations[0];
  const outcome=m.applyObligationChangeAndEvaluateReadiness({caseRecord,obligations,evaluation},{caseId:caseRecord.caseId,obligationId:current.obligationId,expectedRevision:current.revision,change:{status:"RESOLVED"}});
  assert.equal(outcome.result.obligations[0].revision,current.revision+1);
  assert.equal(outcome.result.evaluation.evaluationVersion,8);
  assert.equal(outcome.result.evaluation.sourceObligationRevisions[current.obligationId],current.revision+1);
});

test("stale obligation edit is rejected without a result",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts"); const caseRecord=m.MOBILITY_CASE_FIXTURES[0]; const obligations=m.OBLIGATION_FIXTURES.filter(x=>x.caseId===caseRecord.caseId); const evaluation=m.evaluateMobilityReadiness(caseRecord,obligations); const current=obligations[0];
  const before=structuredClone({caseRecord,obligations,evaluation});
  const outcome=m.applyObligationChangeAndEvaluateReadiness({caseRecord,obligations,evaluation},{caseId:caseRecord.caseId,obligationId:current.obligationId,expectedRevision:current.revision-1,change:{status:"RESOLVED"}});
  assert.match(outcome.error,/stale edit/i); assert.equal("result" in outcome,false); assert.deepEqual({caseRecord,obligations,evaluation},before);
});

test("malformed obligation status blocks and names the raw value",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const caseRecord={...m.MOBILITY_CASE_FIXTURES[3],unsupportedCalculations:[]};
  const malformed={...m.OBLIGATION_FIXTURES[0],obligationId:"OBL-UAT-MALFORMED-01",caseId:caseRecord.caseId,sourceId:caseRecord.caseId,jurisdiction:"Singapore",status:"LOST_IN_TRANSIT"};
  const evaluation=m.evaluateMobilityReadiness(caseRecord,[malformed]);
  assert.equal(evaluation.computedStatus,"BLOCKED");
  assert.equal(evaluation.blockers[0].severity,"BLOCKER");
  assert.equal(evaluation.blockers[0].reason,"Obligation status unrecognized: LOST_IN_TRANSIT");
});

test("two rapid writes using the same revision cannot both succeed",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const caseRecord=m.MOBILITY_CASE_FIXTURES[3];
  const obligations=m.OBLIGATION_FIXTURES.filter(x=>x.caseId===caseRecord.caseId);
  const evaluation=m.evaluateMobilityReadiness(caseRecord,obligations);
  const current=obligations[0];
  const input={caseId:caseRecord.caseId,obligationId:current.obligationId,expectedRevision:current.revision,change:{status:"OPEN"}};
  const first=m.applyObligationChangeAndEvaluateReadiness({caseRecord,obligations,evaluation},input);
  assert.ok(first.result);
  const second=m.applyObligationChangeAndEvaluateReadiness({caseRecord,obligations:first.result.obligations,evaluation:first.result.evaluation},input);
  assert.match(second.error,/stale edit/i);
  assert.equal("result" in second,false);
});

test("validation failure leaves the complete operation state unchanged",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const caseRecord=m.MOBILITY_CASE_FIXTURES[0];
  const obligations=m.OBLIGATION_FIXTURES.filter(x=>x.caseId===caseRecord.caseId);
  const evaluation=m.evaluateMobilityReadiness(caseRecord,obligations,11);
  const state={caseRecord,obligations,evaluation};
  const before=structuredClone(state);
  const current=obligations[0];
  const outcome=m.applyObligationChangeAndEvaluateReadiness(state,{caseId:caseRecord.caseId,obligationId:current.obligationId,expectedRevision:current.revision,change:{reason:""}});
  assert.equal(outcome.error,"A specific obligation reason is required.");
  assert.equal("result" in outcome,false);
  assert.deepEqual(state,before);
});

test("cancelled obligation always becomes review even when open severity was blocker",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts"); const caseRecord={...m.MOBILITY_CASE_FIXTURES[3],unsupportedCalculations:[]}; const cancelled={...m.OBLIGATION_FIXTURES[0],caseId:caseRecord.caseId,sourceId:caseRecord.caseId,status:"CANCELLED",severityWhenOpen:"BLOCKER"}; const evaluation=m.evaluateMobilityReadiness(caseRecord,[cancelled]);
  assert.equal(evaluation.blockers[0].severity,"REVIEW"); assert.equal(evaluation.computedStatus,"REVIEW_REQUIRED");
});

test("fixture coverage includes totalization and non-DTAA branches",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  assert.ok(m.MOBILITY_CASE_FIXTURES.some(x=>x.totalizationAgreement));
  assert.ok(m.MOBILITY_CASE_FIXTURES.some(x=>!x.dtaaExists));
  assert.equal(m.MOBILITY_CASE_FIXTURES.length,5);
});

test("new mobility cases are linked to the Niva payroll employee master",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const payroll=await vite.ssrLoadModule("/lib/uat-niva-data.ts");
  const employee=payroll.UAT_EMPLOYEES.find(x=>x.name==="Neha Menon");
  assert.ok(employee);
  const created=m.buildMobilityCaseFromPayrollEmployee({employee,hostCountry:"United States",assignmentType:"Long-term",owner:"Meera Shah",ordinal:6});
  assert.equal(created.employeeId,"NVL-006");
  assert.equal(created.employeeName,"Neha Menon");
  assert.equal(created.caseId,"MOB-NVL-006-UAT-6");
});

test("a newly created case resolves exactly and never falls back to Aditi",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const created=m.buildMobilityCaseFromPayrollEmployee({employee:{id:"NVL-006",name:"Neha Menon"},hostCountry:"United States",assignmentType:"Long-term",owner:"Meera Shah",ordinal:6});
  const cases=[...m.MOBILITY_CASE_FIXTURES,created];
  assert.equal(m.resolveMobilityCase(cases,created.caseId)?.employeeName,"Neha Menon");
  assert.equal(m.resolveMobilityCase(cases,"MOB-DOES-NOT-EXIST"),null);
});

test("navigation, queue, eight tabs and Compliance ownership are explicit",async()=>{
  const home=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8"); const queue=await readFile(new URL("../app/uat/mobility/page.tsx",import.meta.url),"utf8"); const workspace=await readFile(new URL("../app/uat/mobility/case/page.tsx",import.meta.url),"utf8"); const compliance=await readFile(new URL("../app/uat/compliance/mobility/page.tsx",import.meta.url),"utf8"); const layout=await readFile(new URL("../app/layout.tsx",import.meta.url),"utf8"); const store=await readFile(new URL("../app/uat/mobility/session-store.tsx",import.meta.url),"utf8");
  assert.match(home,/href="\/uat\/mobility"/); assert.match(queue,/Mobility case queue/); assert.match(queue,/Create mobility case/); assert.match(workspace,/Overview.*Immigration.*Days.*Compensation.*Equity.*Tax.*Payroll.*Readiness/s); assert.match(workspace,/Mobility displays the case-filtered view/); assert.match(compliance,/Compliance owns changes/); assert.match(queue,/reset on reload/i);
  assert.match(layout,/MobilitySessionProvider/); assert.match(workspace,/useMobilitySession/); assert.match(compliance,/useMobilitySession/); assert.match(store,/One state-object replacement is the only visible write/); assert.doesNotMatch(compliance,/useState\(OBLIGATION_FIXTURES\)/);
  assert.match(queue,/Assignment lifecycle/); assert.match(queue,/Readiness/); assert.match(queue,/c\.lifecycleStatus === lifecycle/);
  assert.match(queue,/UAT_EMPLOYEES/); assert.match(queue,/niva-payroll-employee-suggestions/); assert.match(queue,/term\.length < 2/); assert.match(queue,/\.slice\(0, 6\)/); assert.doesNotMatch(queue,/<datalist/); assert.match(workspace,/resolveMobilityCase/); assert.doesNotMatch(workspace,/cases\.find\(.*\) \?\? cases\[0\]/);
});

test("permanent transfer moves from India cessation to host payroll",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const ananya=m.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Ananya Rao");
  const evaluation=m.evaluateMobilityReadiness(ananya,m.OBLIGATION_FIXTURES);
  assert.equal(ananya.payrollModel,"Host payroll");
  assert.equal(ananya.indiaEmploymentCessationDate,"2026-03-31");
  assert.equal(ananya.hostPayrollCommencementDate,"2026-04-01");
  assert.equal(ananya.compensationHomePct,0);
  assert.equal(ananya.compensationHostPct,100);
  assert.equal(evaluation.blockers.some(x=>x.workstream==="PAYROLL"),false);
});

test("permanent transfer blocks split payroll, missing dates and overlap",async()=>{
  const m=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const base=m.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Ananya Rao");
  const invalid={...base,payrollModel:"Split",indiaEmploymentCessationDate:null,hostPayrollCommencementDate:null,compensationHomePct:50,compensationHostPct:50};
  const first=m.evaluateMobilityReadiness(invalid,[]);
  assert.equal(first.computedStatus,"BLOCKED");
  assert.ok(first.blockers.some(x=>/cessation date is required/i.test(x.reason)));
  assert.ok(first.blockers.some(x=>/Host payroll commencement date is required/i.test(x.reason)));
  assert.ok(first.blockers.some(x=>/Split and Shadow payroll are not permitted/i.test(x.reason)));
  const overlap=m.evaluateMobilityReadiness({...base,indiaEmploymentCessationDate:"2026-04-01",hostPayrollCommencementDate:"2026-04-01"},[]);
  assert.ok(overlap.blockers.some(x=>/must commence after India employment cessation/i.test(x.reason)));
});
