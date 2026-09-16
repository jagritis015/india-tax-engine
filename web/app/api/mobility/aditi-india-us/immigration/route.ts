import {
  EMPTY_IMMIGRATION_SUPPORT_INPUT,
  answerImmigrationQuestion,
  assessImmigrationSupport,
  type ImmigrationSupportInput,
} from "@/lib/uat-immigration-support";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "X-Immigration-Support-Mode": "deterministic-evidence-grounded-uat",
};

const supportedQuestions = [
  "What blockers are open?",
  "What should we do next?",
  "Can payroll activate?",
  "What expires before the assignment ends?",
  "Summarize the evidence on file.",
];

function payload(input: Partial<ImmigrationSupportInput>, question?: unknown) {
  const assessment = assessImmigrationSupport(input);
  return {
    assessment,
    assistant: typeof question === "string" && question.trim() ? answerImmigrationQuestion(question, assessment) : null,
    supportedQuestions,
    operatingMode: "deterministic-rules-no-paid-ai",
    notice: "Operational UAT support only. No immigration-law conclusion or work-authorization approval is provided.",
  };
}

export async function GET() {
  return new Response(JSON.stringify(payload(EMPTY_IMMIGRATION_SUPPORT_INPUT)), { status: 200, headers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { input?: Partial<ImmigrationSupportInput>; question?: unknown };
    if (!body || typeof body !== "object" || Array.isArray(body) || !body.input || typeof body.input !== "object" || Array.isArray(body.input)) {
      return new Response(JSON.stringify({ error: "An immigration case input object is required." }), { status: 400, headers });
    }
    return new Response(JSON.stringify(payload(body.input, body.question)), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Request body must be valid JSON." }), { status: 400, headers });
  }
}
