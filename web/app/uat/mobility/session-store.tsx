"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyObligationChangeAndEvaluateReadiness,
  evaluateMobilityReadiness,
  MOBILITY_CASE_FIXTURES,
  OBLIGATION_FIXTURES,
  type MobilityCase,
  type ObligationRecord,
  type ReadinessEvaluation,
} from "@/lib/uat-global-mobility";

type SessionState = {
  cases: MobilityCase[];
  obligations: ObligationRecord[];
  evaluations: Record<string, ReadinessEvaluation>;
};

type ObligationChange = Parameters<
  typeof applyObligationChangeAndEvaluateReadiness
>[1];

function freshState(): SessionState {
  const cases = MOBILITY_CASE_FIXTURES.map((item) => ({ ...item }));
  const obligations = OBLIGATION_FIXTURES.map((item) => ({
    ...item,
    evidenceReferences: [...item.evidenceReferences],
  }));
  return {
    cases,
    obligations,
    evaluations: Object.fromEntries(
      cases.map((caseRecord) => [
        caseRecord.caseId,
        evaluateMobilityReadiness(caseRecord, obligations),
      ]),
    ),
  };
}

type SessionStore = SessionState & {
  applyObligationChange: (
    input: ObligationChange,
  ) => ReturnType<typeof applyObligationChangeAndEvaluateReadiness>;
  updateCaseAndEvaluate: (
    caseId: string,
    change: Partial<MobilityCase>,
  ) => ReadinessEvaluation | null;
  addCase: (caseRecord: MobilityCase) => void;
  resetSession: () => void;
  resetCase: (caseId: string) => void;
};

const MobilitySessionContext = createContext<SessionStore | null>(null);

export function MobilitySessionProvider({ children }: { children: ReactNode }) {
  const [state, setRenderedState] = useState<SessionState>(freshState);
  const current = useRef(state);

  const replace = useCallback((next: SessionState) => {
    current.current = next;
    setRenderedState(next);
  }, []);

  const applyObligationChange = useCallback(
    (input: ObligationChange) => {
      const before = current.current;
      const caseRecord = before.cases.find((item) => item.caseId === input.caseId);
      if (!caseRecord)
        return { error: "Case does not match the current UAT session." } as const;
      const evaluation = before.evaluations[input.caseId];
      const outcome = applyObligationChangeAndEvaluateReadiness(
        { caseRecord, obligations: before.obligations, evaluation },
        input,
      );
      if ("error" in outcome) return outcome;

      // One state-object replacement is the only visible write. React cannot
      // render the new obligations without the matching completed evaluation.
      replace({
        ...before,
        obligations: outcome.result.obligations,
        evaluations: {
          ...before.evaluations,
          [input.caseId]: outcome.result.evaluation,
        },
      });
      return outcome;
    },
    [replace],
  );

  const updateCaseAndEvaluate = useCallback(
    (caseId: string, change: Partial<MobilityCase>) => {
      const before = current.current;
      const existing = before.cases.find((item) => item.caseId === caseId);
      if (!existing) return null;
      const nextCase = { ...existing, ...change, caseId: existing.caseId };
      const evaluation = evaluateMobilityReadiness(
        nextCase,
        before.obligations,
        before.evaluations[caseId].evaluationVersion + 1,
      );
      replace({
        ...before,
        cases: before.cases.map((item) =>
          item.caseId === caseId ? nextCase : item,
        ),
        evaluations: { ...before.evaluations, [caseId]: evaluation },
      });
      return evaluation;
    },
    [replace],
  );

  const addCase = useCallback(
    (caseRecord: MobilityCase) => {
      const before = current.current;
      replace({
        ...before,
        cases: [caseRecord, ...before.cases],
        evaluations: {
          ...before.evaluations,
          [caseRecord.caseId]: evaluateMobilityReadiness(
            caseRecord,
            before.obligations,
          ),
        },
      });
    },
    [replace],
  );

  const resetSession = useCallback(() => replace(freshState()), [replace]);
  const resetCase = useCallback(
    (caseId: string) => {
      const fixture = MOBILITY_CASE_FIXTURES.find((item) => item.caseId === caseId);
      if (!fixture) return;
      const before = current.current;
      const fixtureObligations = OBLIGATION_FIXTURES.filter(
        (item) => item.caseId === caseId,
      );
      const obligations = [
        ...before.obligations.filter((item) => item.caseId !== caseId),
        ...fixtureObligations,
      ];
      replace({
        ...before,
        cases: before.cases.map((item) =>
          item.caseId === caseId ? { ...fixture } : item,
        ),
        obligations,
        evaluations: {
          ...before.evaluations,
          [caseId]: evaluateMobilityReadiness(fixture, obligations),
        },
      });
    },
    [replace],
  );

  const value = useMemo(
    () => ({
      ...state,
      applyObligationChange,
      updateCaseAndEvaluate,
      addCase,
      resetSession,
      resetCase,
    }),
    [
      state,
      applyObligationChange,
      updateCaseAndEvaluate,
      addCase,
      resetSession,
      resetCase,
    ],
  );
  return (
    <MobilitySessionContext.Provider value={value}>
      {children}
    </MobilitySessionContext.Provider>
  );
}

export function useMobilitySession() {
  const store = useContext(MobilitySessionContext);
  if (!store)
    throw new Error("useMobilitySession requires MobilitySessionProvider");
  return store;
}

