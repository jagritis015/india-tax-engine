import {
  applyObligationChangeAndEvaluateReadiness,
  type MobilityCase,
  type ObligationRecord,
  type ReadinessEvaluation,
} from "@/lib/uat-global-mobility";

export type TrueUpStatus = "not-due" | "estimated" | "calculated" | "settled";

export type TaxEqualizationRecord = {
  recordId: string;
  caseId: string;
  taxYear: string;
  homeSalary: number;
  hypotheticalTaxRate: number;
  actualHomeLiability: number;
  actualHostLiability: number;
  hypotheticalWithholding: number;
  treatyRelief: number;
  combinedActualLiability: number;
  doubleTaxationExposure: number;
  settlementAmount: number;
  settlementDirection: "EMPLOYER_OWES_ASSIGNEE" | "ASSIGNEE_OWES_EMPLOYER" | "BALANCED";
  trueUpStatus: TrueUpStatus;
  revision: number;
  updatedAt: string;
};

export type TaxEqualizationInputs = Pick<
  TaxEqualizationRecord,
  | "taxYear"
  | "homeSalary"
  | "hypotheticalTaxRate"
  | "actualHomeLiability"
  | "actualHostLiability"
>;

const updatedAt = "2026-09-17T09:00:00+05:30";
const money = (value: number) => Math.round(value);

export function calculateTaxEqualization(
  caseRecord: MobilityCase,
  current: TaxEqualizationRecord,
  input: TaxEqualizationInputs,
): TaxEqualizationRecord {
  const values = [
    input.homeSalary,
    input.hypotheticalTaxRate,
    input.actualHomeLiability,
    input.actualHostLiability,
  ];
  if (!input.taxYear.trim()) throw new Error("Tax year is required.");
  if (values.some((value) => !Number.isFinite(value) || value < 0))
    throw new Error("Tax inputs must be non-negative numbers.");
  if (input.hypotheticalTaxRate > 100)
    throw new Error("Hypothetical tax rate cannot exceed 100%.");

  const hypotheticalWithholding = money(
    input.homeSalary * (input.hypotheticalTaxRate / 100),
  );
  const treatyRelief = caseRecord.dtaaExists
    ? Math.min(input.actualHomeLiability, input.actualHostLiability)
    : 0;
  const combinedActualLiability = money(
    input.actualHomeLiability + input.actualHostLiability - treatyRelief,
  );
  const doubleTaxationExposure = caseRecord.dtaaExists
    ? 0
    : Math.min(input.actualHomeLiability, input.actualHostLiability);
  const delta = money(combinedActualLiability - hypotheticalWithholding);
  return {
    ...current,
    ...input,
    hypotheticalWithholding,
    treatyRelief,
    combinedActualLiability,
    doubleTaxationExposure,
    settlementAmount: Math.abs(delta),
    settlementDirection:
      delta > 0
        ? "EMPLOYER_OWES_ASSIGNEE"
        : delta < 0
          ? "ASSIGNEE_OWES_EMPLOYER"
          : "BALANCED",
    trueUpStatus: "calculated",
    revision: current.revision + 1,
    updatedAt,
  };
}

export const TAX_EQUALIZATION_FIXTURES: TaxEqualizationRecord[] = [
  {
    recordId: "TEQ-NVL-028-2026-27",
    caseId: "MOB-NVL-028-IND-DE",
    taxYear: "2026-27",
    homeSalary: 3600000,
    hypotheticalTaxRate: 25,
    actualHomeLiability: 820000,
    actualHostLiability: 1100000,
    hypotheticalWithholding: 900000,
    treatyRelief: 820000,
    combinedActualLiability: 1100000,
    doubleTaxationExposure: 0,
    settlementAmount: 200000,
    settlementDirection: "EMPLOYER_OWES_ASSIGNEE",
    trueUpStatus: "settled",
    revision: 2,
    updatedAt,
  },
  {
    recordId: "TEQ-NVL-044-2026-27",
    caseId: "MOB-NVL-044-IND-BM",
    taxYear: "2026-27",
    homeSalary: 3000000,
    hypotheticalTaxRate: 20,
    actualHomeLiability: 520000,
    actualHostLiability: 310000,
    hypotheticalWithholding: 600000,
    treatyRelief: 0,
    combinedActualLiability: 830000,
    doubleTaxationExposure: 310000,
    settlementAmount: 230000,
    settlementDirection: "EMPLOYER_OWES_ASSIGNEE",
    trueUpStatus: "calculated",
    revision: 1,
    updatedAt,
  },
];

export function settleTaxEqualizationThroughReadiness(state: {
  caseRecord: MobilityCase;
  obligations: ObligationRecord[];
  evaluation: ReadinessEvaluation;
  records: TaxEqualizationRecord[];
}) {
  const record = state.records.find((item) => item.caseId === state.caseRecord.caseId);
  if (!record) return { error: "Tax equalization record was not found." } as const;
  if (record.trueUpStatus !== "calculated")
    return { error: "Calculate the tax equalization true-up before settling it." } as const;
  const taxObligation = state.obligations.find(
    (item) => item.caseId === state.caseRecord.caseId && item.workstream === "TAX",
  );
  if (!taxObligation)
    return { error: "Tax Readiness obligation was not found." } as const;

  const readiness = applyObligationChangeAndEvaluateReadiness(
    {
      caseRecord: state.caseRecord,
      obligations: state.obligations,
      evaluation: state.evaluation,
    },
    {
      caseId: state.caseRecord.caseId,
      obligationId: taxObligation.obligationId,
      expectedRevision: taxObligation.revision,
      change: {
        status: "RESOLVED",
        reason: `Tax equalization settlement completed for tax year ${record.taxYear}.`,
      },
    },
  );
  if ("error" in readiness) return readiness;

  const settledRecord = {
    ...record,
    trueUpStatus: "settled" as const,
    revision: record.revision + 1,
    updatedAt,
  };
  return {
    result: {
      obligations: readiness.result.obligations,
      evaluation: readiness.result.evaluation,
      records: state.records.map((item) =>
        item.recordId === settledRecord.recordId ? settledRecord : item,
      ),
    },
  } as const;
}
