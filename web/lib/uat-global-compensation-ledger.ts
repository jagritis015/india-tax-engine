export type CompensationJurisdiction = "India" | "United States" | "Both" | "Review";
export type CompensationTreatment = "home-payroll" | "host-payroll" | "shadow-payroll" | "mobility-only" | "review";

export type CompensationLedgerItem = {
  id: string;
  label: string;
  amount: number;
  currency: "INR" | "USD";
  frequency: "monthly" | "annual" | "one-time";
  payer: string;
  jurisdiction: CompensationJurisdiction;
  treatment: CompensationTreatment;
  policyIncludedInHypo: boolean;
  evidenceStatus: "verified" | "pending";
};

export const ADITI_INDIA_US_LEDGER: CompensationLedgerItem[] = [
  { id:"base", label:"India base salary", amount:156000, currency:"INR", frequency:"monthly", payer:"Niva Labs India Pvt Ltd", jurisdiction:"India", treatment:"home-payroll", policyIncludedInHypo:true, evidenceStatus:"verified" },
  { id:"housing", label:"U.S. housing allowance", amount:250000, currency:"INR", frequency:"monthly", payer:"Niva Labs India Pvt Ltd", jurisdiction:"Review", treatment:"review", policyIncludedInHypo:false, evidenceStatus:"pending" },
  { id:"mobility", label:"Mobility allowance", amount:100000, currency:"INR", frequency:"monthly", payer:"Niva Labs India Pvt Ltd", jurisdiction:"Review", treatment:"review", policyIncludedInHypo:false, evidenceStatus:"pending" },
];

export function summarizeCompensationLedger(items: CompensationLedgerItem[]) {
  const monthlyInr = items.filter(x=>x.currency==="INR" && x.frequency==="monthly").reduce((sum,x)=>sum+x.amount,0);
  const unresolved = items.filter(x=>x.jurisdiction==="Review" || x.treatment==="review" || x.evidenceStatus==="pending").length;
  const hypoMonthlyInr = items.filter(x=>x.currency==="INR" && x.frequency==="monthly" && x.policyIncludedInHypo).reduce((sum,x)=>sum+x.amount,0);
  return { monthlyInr, hypoMonthlyInr, unresolved };
}
