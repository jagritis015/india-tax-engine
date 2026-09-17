import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType:"custom", configFile:false, root, resolve:{alias:{"@":root}}, server:{middlewareMode:true} });
test.after(async()=>vite.close());

test("Rohan Kapoor DTAA fixture applies relief and is settled end to end", async()=>{
  const mobility=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const tax=await vite.ssrLoadModule("/lib/uat-tax-equalization.ts");
  const rohan=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Rohan Kapoor");
  const record=tax.TAX_EQUALIZATION_FIXTURES.find(x=>x.caseId===rohan.caseId);
  assert.equal(rohan.totalizationAgreement,true);
  assert.equal(rohan.dtaaExists,true);
  assert.equal(record.treatyReliefMethod,"CREDIT");
  assert.equal(record.stayAtHomeBaseSalary,3600000);
  assert.deepEqual(record.excludedAssignmentAllowances,{cola:240000,hardship:180000,housingPremium:360000});
  assert.deepEqual({withholding:record.hypotheticalWithholding,relief:record.treatyRelief,actual:record.combinedActualLiability,exposure:record.doubleTaxationExposure,settlement:record.settlementAmount,direction:record.settlementDirection,status:record.trueUpStatus},{withholding:900000,relief:820000,actual:1100000,exposure:0,settlement:200000,direction:"EMPLOYER_OWES_ASSIGNEE",status:"settled"});
});

test("Neha Iyer non-DTAA fixture exposes double taxation as money", async()=>{
  const mobility=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const tax=await vite.ssrLoadModule("/lib/uat-tax-equalization.ts");
  const neha=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Neha Iyer");
  const record=tax.TAX_EQUALIZATION_FIXTURES.find(x=>x.caseId===neha.caseId);
  assert.equal(neha.dtaaExists,false);
  assert.deepEqual({withholding:record.hypotheticalWithholding,relief:record.treatyRelief,actual:record.combinedActualLiability,exposure:record.doubleTaxationExposure,settlement:record.settlementAmount,direction:record.settlementDirection,status:record.trueUpStatus},{withholding:600000,relief:0,actual:830000,exposure:310000,settlement:230000,direction:"EMPLOYER_OWES_ASSIGNEE",status:"calculated"});
});

test("settling Neha uses the combined obligation operation and clears Tax readiness blocker", async()=>{
  const mobility=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const tax=await vite.ssrLoadModule("/lib/uat-tax-equalization.ts");
  const caseRecord=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Neha Iyer");
  const obligations=mobility.OBLIGATION_FIXTURES;
  const evaluation=mobility.evaluateMobilityReadiness(caseRecord,obligations,4);
  assert.ok(evaluation.blockers.some(x=>x.workstream==="TAX"));
  const outcome=tax.settleTaxEqualizationThroughReadiness({caseRecord,obligations,evaluation,records:tax.TAX_EQUALIZATION_FIXTURES});
  assert.equal(outcome.result.records.find(x=>x.caseId===caseRecord.caseId).trueUpStatus,"settled");
  assert.equal(outcome.result.obligations.find(x=>x.obligationId==="OBL-BM-TAX-01").status,"RESOLVED");
  assert.equal(outcome.result.evaluation.blockers.some(x=>x.workstream==="TAX"),false);
  assert.equal(outcome.result.evaluation.evaluationVersion,5);
});

test("tax calculation validation failure leaves inputs and record unchanged", async()=>{
  const mobility=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const tax=await vite.ssrLoadModule("/lib/uat-tax-equalization.ts");
  const caseRecord=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Neha Iyer");
  const record=tax.TAX_EQUALIZATION_FIXTURES.find(x=>x.caseId===caseRecord.caseId);
  const before=structuredClone(record);
  assert.throws(()=>tax.calculateTaxEqualization(caseRecord,record,{taxYear:"2026-27",stayAtHomeBaseSalary:3000000,hypotheticalTaxRate:120,actualHomeLiability:520000,actualHostLiability:310000}),/cannot exceed 100/);
  assert.deepEqual(record,before);
});

test("assignment type gates equalization, protection and host-terms paths", async()=>{
  const mobility=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const tax=await vite.ssrLoadModule("/lib/uat-tax-equalization.ts");
  const rohan=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Rohan Kapoor");
  const neha=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Neha Iyer");
  const kiran=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Kiran Verma");
  const ananya=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Ananya Rao");
  assert.equal(tax.assignmentTaxMechanism(rohan.assignmentType),"TAX_EQUALIZATION");
  assert.equal(tax.assignmentTaxMechanism(neha.assignmentType),"TAX_EQUALIZATION");
  assert.equal(tax.assignmentTaxMechanism(kiran.assignmentType),"TAX_PROTECTION");
  assert.equal(tax.assignmentTaxMechanism(ananya.assignmentType),"HOST_TERMS");
});

test("business traveler and permanent transfer cannot run equalization", async()=>{
  const mobility=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const tax=await vite.ssrLoadModule("/lib/uat-tax-equalization.ts");
  const seed=tax.TAX_EQUALIZATION_FIXTURES[0];
  const input={taxYear:"2026-27",stayAtHomeBaseSalary:1000000,hypotheticalTaxRate:20,actualHomeLiability:180000,actualHostLiability:50000};
  for(const name of ["Kiran Verma","Ananya Rao"]){
    const caseRecord=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName===name);
    assert.throws(()=>tax.calculateTaxEqualization(caseRecord,{...seed,caseId:caseRecord.caseId},input),/not permitted/);
  }
});

test("assignment allowances never inflate hypothetical withholding", async()=>{
  const mobility=await vite.ssrLoadModule("/lib/uat-global-mobility.ts");
  const tax=await vite.ssrLoadModule("/lib/uat-tax-equalization.ts");
  const rohan=mobility.MOBILITY_CASE_FIXTURES.find(x=>x.employeeName==="Rohan Kapoor");
  const seed=tax.TAX_EQUALIZATION_FIXTURES.find(x=>x.caseId===rohan.caseId);
  const result=tax.calculateTaxEqualization(rohan,seed,{taxYear:"2026-27",stayAtHomeBaseSalary:3600000,hypotheticalTaxRate:25,actualHomeLiability:820000,actualHostLiability:1100000});
  assert.equal(result.hypotheticalWithholding,900000);
  assert.notEqual(result.hypotheticalWithholding,1095000);
});
