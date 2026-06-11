import { NextResponse } from "next/server";
import { recommend, validateAnswers } from "@/lib/recommendation";
import type { WizardAnswers } from "@/lib/types";

// POST /api/recommend — accepts questionnaire answers, returns a recommendation.
export async function POST(request: Request) {
  let body: Partial<WizardAnswers>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const answers: WizardAnswers = {
    filingType: body.filingType ?? null,
    incomeSources: Array.isArray(body.incomeSources) ? body.incomeSources : [],
    deductions: Array.isArray(body.deductions) ? body.deductions : [],
    helpPreference: body.helpPreference ?? null,
    companyHadRevenue:
      typeof body.companyHadRevenue === "boolean" ? body.companyHadRevenue : null,
  };

  const errors = validateAnswers(answers);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  return NextResponse.json({ result: recommend(answers) });
}
