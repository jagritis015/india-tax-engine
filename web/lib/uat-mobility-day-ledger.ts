import { assessSubstantialPresence } from "./us-substantial-presence";

export type MobilityDayEvidence = "travel-record" | "employee-declaration" | "assignment-record";
export type MobilityDayClassification = "counted-us-day" | "excluded-us-day" | "outside-us";

export type MobilityDayLedgerEntry = {
  id: string;
  date: string;
  country: "India" | "United States" | "Other";
  classification: MobilityDayClassification;
  evidence: MobilityDayEvidence;
  evidenceStatus: "verified" | "pending";
  note: string;
};

export const ADITI_DAY_LEDGER: MobilityDayLedgerEntry[] = [
  { id:"d1", date:"2026-01-12", country:"United States", classification:"counted-us-day", evidence:"travel-record", evidenceStatus:"verified", note:"UAT arrival evidence" },
  { id:"d2", date:"2026-01-13", country:"United States", classification:"counted-us-day", evidence:"assignment-record", evidenceStatus:"verified", note:"Assignment day" },
  { id:"d3", date:"2026-01-14", country:"United States", classification:"counted-us-day", evidence:"employee-declaration", evidenceStatus:"pending", note:"Awaiting corroboration" },
  { id:"d4", date:"2025-11-10", country:"United States", classification:"counted-us-day", evidence:"travel-record", evidenceStatus:"verified", note:"Prior-year business travel" },
  { id:"d5", date:"2024-06-18", country:"United States", classification:"counted-us-day", evidence:"travel-record", evidenceStatus:"verified", note:"Second-prior-year travel" },
];

export function summarizeMobilityDayLedger(entries: MobilityDayLedgerEntry[]) {
  const byYear = new Map<number, {physical:number; excluded:number; pending:number}>();
  for (const entry of entries) {
    const year = Number(entry.date.slice(0,4));
    const bucket = byYear.get(year) ?? { physical:0, excluded:0, pending:0 };
    if (entry.country === "United States") {
      bucket.physical += 1;
      if (entry.classification === "excluded-us-day") bucket.excluded += 1;
      if (entry.evidenceStatus === "pending") bucket.pending += 1;
    }
    byYear.set(year,bucket);
  }
  const current = byYear.get(2026) ?? {physical:0,excluded:0,pending:0};
  const prior = byYear.get(2025) ?? {physical:0,excluded:0,pending:0};
  const second = byYear.get(2024) ?? {physical:0,excluded:0,pending:0};
  const spt = assessSubstantialPresence({
    currentYearDays: current.physical,
    priorYearDays: prior.physical,
    secondPriorYearDays: second.physical,
    excludedCurrentYearDays: current.excluded,
    excludedPriorYearDays: prior.excluded,
    excludedSecondPriorYearDays: second.excluded,
  });
  const pendingEvidence = current.pending + prior.pending + second.pending;
  return { current, prior, second, pendingEvidence, spt };
}
