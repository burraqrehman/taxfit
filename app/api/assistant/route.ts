import { NextResponse } from "next/server";
import { askAssistant } from "@/lib/assistant";

// POST /api/assistant — accepts a user question, returns grounded guidance.
export async function POST(request: Request) {
  let body: { question?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }

  const response = await askAssistant(question);
  return NextResponse.json({ response });
}
