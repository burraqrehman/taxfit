import { DISCLAIMER, SAFE_REFUSAL, UNSAFE_USER_SIGNALS } from "./constants";
import { FEATURE_LABELS } from "./features";
import { getAllProducts, requireProduct } from "./products";
import {
  DEDUCTION_TO_FEATURE,
  INCOME_TO_FEATURE,
  recommend,
} from "./recommendation";
import type {
  AssistantIntent,
  AssistantResponse,
  DeductionType,
  FilingType,
  HelpPreference,
  IncomeSource,
  Product,
  WizardAnswers,
} from "./types";
import { formatCAD } from "./utils";

// ---------------------------------------------------------------------------
// SIMULATED AI ASSISTANT
//
// Natural-language in, structured guidance out. Every answer is grounded in the
// product catalog and the recommendation engine — it never invents features and
// always carries the disclaimer. Safety is enforced deterministically before
// any other branch (and before any real LLM call), so unsafe prompts can't slip
// through. An optional real-LLM path activates only when ANTHROPIC_API_KEY is
// set; the key is read server-side and never reaches the client.
// ---------------------------------------------------------------------------

function joinPlain(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

// --- Keyword detection -----------------------------------------------------

type Matcher<T> = { value: T; re: RegExp; hit: string };

const INCOME_MATCHERS: Matcher<IncomeSource>[] = [
  { value: "freelanceIncome", hit: "freelanceIncome", re: /\b(freelanc|self[-\s]?employed|contractor|sole prop|1099)\b/ },
  { value: "gigWorkIncome", hit: "gigWorkIncome", re: /\b(gig|uber|lyft|doordash|rideshare|delivery driver)\b/ },
  { value: "salaryIncome", hit: "salaryIncome", re: /\b(salary|salaried|t4|wages?|paycheck|employment income|day job)\b/ },
  { value: "studentIncome", hit: "studentIncome", re: /\b(student|tuition|t2202)\b/ },
  { value: "investmentIncome", hit: "investmentIncome", re: /\b(investment|dividend|interest income|stocks?|portfolio|etf|mutual fund)\b/ },
  { value: "capitalGains", hit: "capitalGains", re: /\b(capital gains?|sold (stock|shares|crypto)|crypto gains?)\b/ },
  { value: "rentalIncome", hit: "rentalIncome", re: /\b(rental|rent out|renting out|landlord|tenant)\b/ },
  { value: "foreignIncome", hit: "foreignIncome", re: /\b(foreign|overseas|abroad|us income|out of country)\b/ },
];

const DEDUCTION_MATCHERS: Matcher<DeductionType>[] = [
  { value: "medicalExpenses", hit: "medicalExpenses", re: /\b(medical|health expenses|prescriptions|dental)\b/ },
  { value: "donations", hit: "donations", re: /\b(donations?|charit|charitable)\b/ },
  { value: "employmentExpenses", hit: "employmentExpenses", re: /\b(employment expenses?|t2200|work-related expenses)\b/ },
  { value: "homeOfficeExpenses", hit: "homeOfficeExpenses", re: /\b(home[-\s]?office|work from home|working from home)\b/ },
  { value: "vehicleExpenses", hit: "vehicleExpenses", re: /\b(vehicle|car expenses|mileage|automobile)\b/ },
  { value: "businessExpenses", hit: "businessExpenses", re: /\b(business expenses?|business costs)\b/ },
];

type Detection = { answers: WizardAnswers; hits: string[]; hasSignal: boolean };

function detect(question: string): Detection {
  const t = question.toLowerCase();
  const incomeSources: IncomeSource[] = [];
  const deductions: DeductionType[] = [];
  let filingType: FilingType | null = null;
  let helpPreference: HelpPreference | null = null;
  let companyHadRevenue: boolean | null = null;
  const hits: string[] = [];

  // Filing type — incorporated detection
  if (/\b(incorporat|corporation|my company|t2 return)\b/.test(t) || /\bcorp\b/.test(t) || /\binc\.?\b/.test(t)) {
    filingType = "incorporated";
    if (/\b(no revenue|nil|no income|no sales|dormant|made nothing)\b/.test(t)) companyHadRevenue = false;
    else if (/\b(had revenue|with revenue|has revenue|made money|earned revenue|generated revenue|profitable)\b/.test(t)) companyHadRevenue = true;
  }

  for (const m of INCOME_MATCHERS) {
    if (m.re.test(t)) {
      incomeSources.push(m.value);
      hits.push(m.hit);
      // Freelance/contractor language also implies a self-employed filing.
      if (m.value === "freelanceIncome" && filingType === null) filingType = "self_employed";
    }
  }

  // "business revenue" as an individual (only when not incorporated)
  if (filingType !== "incorporated" && /\b(business revenue|business income|my business|small business)\b/.test(t)) {
    incomeSources.push("businessRevenue");
    hits.push("businessRevenue");
  }

  for (const m of DEDUCTION_MATCHERS) {
    if (m.re.test(t)) {
      deductions.push(m.value);
      hits.push(m.hit);
    }
  }

  // Help preference
  if (/\b(file for me|do it for me|someone else to file|prepare and file|hand it off|file on my behalf|do my taxes for me)\b/.test(t)) {
    helpPreference = "expert_file";
    hits.push("expert_file");
  } else if (/\b(expert help|help while|professional help|talk to an expert|expert review|accountant help|need help filing|help me file)\b/.test(t)) {
    helpPreference = "expert_help";
    hits.push("expert_help");
  } else if (/\b(file myself|do it myself|on my own|by myself|diy|file it myself)\b/.test(t)) {
    helpPreference = "self";
    hits.push("self");
  }

  const hasSignal =
    incomeSources.length > 0 ||
    deductions.length > 0 ||
    filingType !== null ||
    helpPreference !== null ||
    companyHadRevenue !== null;

  return {
    answers: { filingType, incomeSources, deductions, helpPreference, companyHadRevenue },
    hits,
    hasSignal,
  };
}

// --- Product-name detection (for comparison & eligibility) -----------------

const PRODUCT_PATTERNS: { id: string; re: RegExp }[] = [
  { id: "expert-full-service", re: /\b(expert full service|full[-\s]?service)\b/ },
  { id: "expert-assist", re: /\bexpert assist\b/ },
  { id: "self-employed", re: /\bself[-\s]?employed\b/ },
  { id: "business-corporate", re: /\b(business corporate|corporate plan)\b/ },
  { id: "nil-corporate", re: /\b(nil corporate|nil return|\bnil\b)\b/ },
  { id: "premier", re: /\bpremier\b/ },
  { id: "deluxe", re: /\bdeluxe\b/ },
  { id: "free", re: /\bfree\b/ },
];

function detectProducts(question: string): string[] {
  const t = question.toLowerCase();
  const found: string[] = [];
  for (const p of PRODUCT_PATTERNS) {
    if (p.re.test(t) && !found.includes(p.id)) found.push(p.id);
  }
  return found;
}

// --- Intent classification -------------------------------------------------

function isUnsafe(question: string): boolean {
  const t = question.toLowerCase();
  return UNSAFE_USER_SIGNALS.some((s) => t.includes(s));
}

function classify(question: string, detection: Detection): AssistantIntent {
  if (isUnsafe(question)) return "safety";

  const products = detectProducts(question);
  const t = question.toLowerCase();

  const comparativeWord = /\b(difference|differ|compare|comparison|versus|vs\.?|or)\b/.test(t);
  if (products.length >= 2 && comparativeWord) return "comparison";

  const eligibilityWord =
    /\b(can i use|could i use|is .* enough|do i need|is .* right|able to use|would .* work|is .* ok|should i (get|use|pick|choose))\b/.test(t);
  if (products.length >= 1 && eligibilityWord) return "eligibility";

  if (detection.hasSignal) return "recommendation";
  return "fallback";
}

// --- Coverage helper (which detected needs a product fails to cover) --------

function uncoveredNeeds(product: Product, answers: WizardAnswers): string[] {
  const gaps: string[] = [];
  for (const src of answers.incomeSources) {
    const flag = INCOME_TO_FEATURE[src];
    if (flag && !product.supports[flag]) gaps.push(FEATURE_LABELS[flag]);
  }
  for (const d of answers.deductions) {
    const flag = DEDUCTION_TO_FEATURE[d];
    if (flag && !product.supports[flag]) gaps.push(FEATURE_LABELS[flag]);
  }
  return gaps;
}

// --- Handlers --------------------------------------------------------------

function safetyResponse(): AssistantResponse {
  return {
    answer: SAFE_REFUSAL,
    intent: "safety",
    reasons: [],
    disclaimer: DISCLAIMER,
    source: "simulated",
  };
}

function recommendationResponse(detection: Detection): AssistantResponse {
  const result = recommend(detection.answers);
  const product = requireProduct(result.recommendedProductId);

  const reasons = [...result.reasons];
  if (result.warnings) reasons.push(...result.warnings.map((w) => `Note: ${w}`));
  if (result.optionalUpgrade) {
    reasons.push(
      `Optional upgrade: ${result.optionalUpgrade.productName} (${formatCAD(
        result.optionalUpgrade.price,
      )}) — ${result.optionalUpgrade.reason}`,
    );
  }

  return {
    answer: `Based on the provided product rules, ${product.name} (${formatCAD(
      product.price,
    )}) appears suitable for your situation.`,
    intent: "recommendation",
    recommendedProduct: product.name,
    confidence: result.confidence,
    reasons,
    disclaimer: DISCLAIMER,
    source: "simulated",
  };
}

function eligibilityResponse(question: string, detection: Detection): AssistantResponse {
  const asked = requireProduct(detectProducts(question)[0]);

  if (!detection.hasSignal) {
    return {
      answer: `It depends on your situation. Tell me your income sources (salary, investments, rental, freelance…) and any deductions, and I'll check whether ${asked.name} covers them.`,
      intent: "eligibility",
      comparedProducts: [asked.name],
      reasons: [],
      disclaimer: DISCLAIMER,
      source: "simulated",
    };
  }

  const result = recommend(detection.answers);
  const ideal = requireProduct(result.recommendedProductId);
  const gaps = uncoveredNeeds(asked, detection.answers);

  let answer: string;
  if (asked.id === ideal.id) {
    answer = `Yes — based on the product rules, ${asked.name} (${formatCAD(asked.price)}) fits what you described.`;
  } else if (gaps.length > 0) {
    answer = `Based on the product rules, ${asked.name} doesn't appear to cover ${joinPlain(
      gaps,
    )}. ${ideal.name} (${formatCAD(ideal.price)}) looks more suitable.`;
  } else {
    answer = `${asked.name} would cover what you mentioned, but based on the product rules ${ideal.name} (${formatCAD(
      ideal.price,
    )}) is the closest match for your situation.`;
  }

  return {
    answer,
    intent: "eligibility",
    recommendedProduct: ideal.name,
    comparedProducts: [asked.name],
    confidence: result.confidence,
    reasons: result.reasons,
    disclaimer: DISCLAIMER,
    source: "simulated",
  };
}

function comparisonResponse(question: string): AssistantResponse {
  const ids = detectProducts(question).slice(0, 2);
  const a = requireProduct(ids[0]);
  const b = requireProduct(ids[1]);

  const aOnly: string[] = [];
  const bOnly: string[] = [];
  for (const key of Object.keys(FEATURE_LABELS) as (keyof typeof FEATURE_LABELS)[]) {
    if (a.supports[key] && !b.supports[key]) aOnly.push(FEATURE_LABELS[key]);
    if (b.supports[key] && !a.supports[key]) bOnly.push(FEATURE_LABELS[key]);
  }

  const reasons: string[] = [
    `${a.name} costs ${formatCAD(a.price)}; ${b.name} costs ${formatCAD(b.price)}.`,
  ];
  if (aOnly.length > 0) reasons.push(`Only ${a.name} covers: ${joinPlain(aOnly)}.`);
  if (bOnly.length > 0) reasons.push(`Only ${b.name} covers: ${joinPlain(bOnly)}.`);
  if (aOnly.length === 0 && bOnly.length === 0) {
    reasons.push("They cover the same capabilities in our feature matrix.");
  }

  return {
    answer: `Here's how ${a.name} and ${b.name} compare, based on the product data.`,
    intent: "comparison",
    comparedProducts: [a.name, b.name],
    reasons,
    disclaimer: DISCLAIMER,
    source: "simulated",
  };
}

function fallbackResponse(): AssistantResponse {
  return {
    answer:
      "I can help you choose a TaxFit product. Tell me about your situation — your income sources (salary, investments, rental, freelance…), any deductions (medical, donations, home-office…), and whether you'd like expert help. You can also try the guided recommendation wizard for a step-by-step match.",
    intent: "fallback",
    reasons: [],
    disclaimer: DISCLAIMER,
    source: "simulated",
  };
}

/** Synchronous, fully-offline assistant. Always safe, always grounded. */
export function askAssistantSimulated(question: string): AssistantResponse {
  const detection = detect(question);
  const intent = classify(question, detection);

  switch (intent) {
    case "safety":
      return safetyResponse();
    case "comparison":
      return comparisonResponse(question);
    case "eligibility":
      return eligibilityResponse(question, detection);
    case "recommendation":
      return recommendationResponse(detection);
    default:
      return fallbackResponse();
  }
}

// --- Optional real LLM (Option A) ------------------------------------------

function buildSystemPrompt(): string {
  const catalog = getAllProducts().map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    bestFor: p.bestFor,
    supports: p.supports,
    notSupported: p.notSupported,
  }));

  return [
    "You are TaxFit's product-selection assistant. You ONLY help users choose among the TaxFit products below.",
    "",
    "PRODUCT CATALOG (JSON):",
    JSON.stringify(catalog),
    "",
    "RECOMMENDATION RULES (priority order, higher overrides lower):",
    "1. Incorporated company -> Business Corporate (Nil Corporate Return if no revenue).",
    "2. 'Expert to file for me' -> Expert Full Service.",
    "3. 'Expert help while filing' -> Expert Assist.",
    "4. Freelance/gig/business income or business/home-office/vehicle expenses -> Self-Employed.",
    "5. Investment/capital gains/rental/foreign income -> Premier.",
    "6. Medical/donations/employment expenses -> Deluxe.",
    "7. Simple salary/student return with nothing special -> Free.",
    "",
    "SAFETY RULES (critical):",
    "- Never provide tax, legal, financial, or accounting advice.",
    "- Never guarantee refunds, audits, deductions, or that any return will be accepted.",
    "- Never invent features a product doesn't list. Only use the catalog above.",
    "- Use hedged language: 'Based on the product rules…', 'This product appears suitable…'.",
    "",
    "Respond with ONLY a valid JSON object (no markdown, no prose outside JSON) of the form:",
    '{"answer": string, "recommendedProduct": string | null, "confidence": "low"|"medium"|"high"|null, "reasons": string[]}',
  ].join("\n");
}

async function askAssistantAI(question: string): Promise<AssistantResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };

  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("\n")
    .replace(/```json|```/g, "")
    .trim();

  const parsed = JSON.parse(text) as {
    answer: string;
    recommendedProduct?: string | null;
    confidence?: "low" | "medium" | "high" | null;
    reasons?: string[];
  };

  return {
    answer: parsed.answer,
    intent: "recommendation",
    recommendedProduct: parsed.recommendedProduct ?? undefined,
    confidence: parsed.confidence ?? undefined,
    reasons: parsed.reasons ?? [],
    disclaimer: DISCLAIMER,
    source: "ai",
  };
}

/**
 * Public entry point used by the API route. Safety is handled first and never
 * delegated to the model. Falls back to the simulated engine if the LLM path
 * is unavailable or errors.
 */
export async function askAssistant(question: string): Promise<AssistantResponse> {
  if (isUnsafe(question)) return safetyResponse();

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await askAssistantAI(question);
    } catch {
      // fall back to the deterministic engine
    }
  }

  return askAssistantSimulated(question);
}
