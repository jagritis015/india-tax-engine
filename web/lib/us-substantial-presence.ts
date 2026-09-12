export type SubstantialPresenceInput = {
  currentYearDays: number;
  priorYearDays: number;
  secondPriorYearDays: number;
  excludedCurrentYearDays?: number;
  excludedPriorYearDays?: number;
  excludedSecondPriorYearDays?: number;
};

export type SubstantialPresenceResult = {
  status: "MEETS_SPT" | "DOES_NOT_MEET_SPT" | "REVIEW_REQUIRED";
  currentYearCountedDays: number;
  priorYearCountedDays: number;
  secondPriorYearCountedDays: number;
  weightedDaysNumeratorSixths: number;
  weightedDays: number;
  currentYear31DayTest: boolean;
  threeYear183DayTest: boolean;
  reviewReason: string | null;
  ruleVersion: "US-SPT-2026-09-IRS";
  source: "IRS substantial presence test";
};

function validDays(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 366;
}

export function assessSubstantialPresence(input: SubstantialPresenceInput): SubstantialPresenceResult {
  const excludedCurrent = input.excludedCurrentYearDays ?? 0;
  const excludedPrior = input.excludedPriorYearDays ?? 0;
  const excludedSecondPrior = input.excludedSecondPriorYearDays ?? 0;
  const values = [input.currentYearDays,input.priorYearDays,input.secondPriorYearDays,excludedCurrent,excludedPrior,excludedSecondPrior];

  if (!values.every(validDays)) {
    return review("Day counts must be whole numbers between 0 and 366.");
  }
  if (excludedCurrent > input.currentYearDays || excludedPrior > input.priorYearDays || excludedSecondPrior > input.secondPriorYearDays) {
    return review("Excluded days cannot exceed physical-presence days for the same year.");
  }

  const current = input.currentYearDays - excludedCurrent;
  const prior = input.priorYearDays - excludedPrior;
  const secondPrior = input.secondPriorYearDays - excludedSecondPrior;

  // Exact arithmetic in sixths avoids floating-point threshold errors:
  // current year + 1/3 prior year + 1/6 second-prior year.
  const weightedSixths = current * 6 + prior * 2 + secondPrior;
  const currentYear31DayTest = current >= 31;
  const threeYear183DayTest = weightedSixths >= 183 * 6;

  return {
    status: currentYear31DayTest && threeYear183DayTest ? "MEETS_SPT" : "DOES_NOT_MEET_SPT",
    currentYearCountedDays: current,
    priorYearCountedDays: prior,
    secondPriorYearCountedDays: secondPrior,
    weightedDaysNumeratorSixths: weightedSixths,
    weightedDays: Math.round((weightedSixths / 6) * 100) / 100,
    currentYear31DayTest,
    threeYear183DayTest,
    reviewReason: null,
    ruleVersion: "US-SPT-2026-09-IRS",
    source: "IRS substantial presence test",
  };
}

function review(reason: string): SubstantialPresenceResult {
  return {
    status: "REVIEW_REQUIRED",
    currentYearCountedDays: 0,
    priorYearCountedDays: 0,
    secondPriorYearCountedDays: 0,
    weightedDaysNumeratorSixths: 0,
    weightedDays: 0,
    currentYear31DayTest: false,
    threeYear183DayTest: false,
    reviewReason: reason,
    ruleVersion: "US-SPT-2026-09-IRS",
    source: "IRS substantial presence test",
  };
}
