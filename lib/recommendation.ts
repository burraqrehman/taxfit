import { DISCLAIMER } from "./constants";
import { inputLabel } from "./options";
import { requireProduct } from "./products";
import type {
  Confidence,
  DeductionType,
  FeatureKey,
  IncomeSource,
  Product,
  RecommendationResult,
  ValidationError,
  WizardAnswers,
} from "./types";

// ---------------------------------------------------------------------------
// RECOMMENDATION ENGINE
//
// Pure functions, zero UI/framework imports — fully unit-testable and reused
// verbatim by both POST /api/recommend and the simulated assistant.
//
// Priority order (brief §8). Higher rules override lower ones:
//   1. Incorporated company   -> Business Corporate / Nil Corporate Return
//   2. Expert Full Service    -> "expert files for me"
//   3. Expert Assist          -> "expert help while filing"
//   4. Self-Employed          -> freelance / gig / business / those expenses
//   5. Premier                -> investment / capital gains / rental / foreign
//   6. Deluxe                 -> medical / donations / employment expenses
//   7. Free                   -> simple salary/student return, nothing special
// ---------------------------------------------------------------------------

/** Map a questionnaire income source to a product capability flag (if any). */
export const INCOME_TO_FEATURE: Partial<Record<IncomeSource, FeatureKey>> = {
  salaryIncome: "salaryIncome",
  studentIncome: "studentIncome",
  investmentIncome: "investmentIncome",
  capitalGains: "capitalGains",
  rentalIncome: "rentalIncome",
  freelanceIncome: "freelanceIncome",
  gigWorkIncome: "gigWorkIncome",
  foreignIncome: "foreignIncome",
  // businessRevenue has no direct flag — it's a self-employment signal.
};

export const DEDUCTION_TO_FEATURE: Partial<Record<DeductionType, FeatureKey>> = {
  medicalExpenses: "medicalExpenses",
  donations: "donations",
  employmentExpenses: "employmentExpenses",
  homeOfficeExpenses: "homeOfficeExpenses",
  vehicleExpenses: "vehicleExpenses",
  businessExpenses: "businessExpenses",
};

// --- Validation (brief §14) ------------------------------------------------

export function validateAnswers(answers: WizardAnswers): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!answers.filingType) {
    errors.push({ field: "filingType", message: "Please choose what you're filing for." });
  }

  // Income is required for individuals; an incorporated nil-return may have none.
  if (answers.filingType !== "incorporated" && answers.incomeSources.length === 0) {
    errors.push({
      field: "incomeSources",
      message: "Select at least one income source.",
    });
  }

  if (!answers.helpPreference) {
    errors.push({ field: "helpPreference", message: "Tell us how much help you'd like." });
  }

  if (answers.filingType === "incorporated" && answers.companyHadRevenue === null) {
    errors.push({
      field: "companyHadRevenue",
      message: "Let us know whether the company had revenue.",
    });
  }

  return errors;
}

// --- Helpers ---------------------------------------------------------------

/** Join already-resolved labels into a natural list. */
function joinPlain(labels: string[]): string {
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/** Join input keys (resolving each to its label). */
function joinLabels(keys: string[]): string {
  return joinPlain(keys.map(inputLabel));
}

/** Warn about any selected input the recommended product doesn't cover. */
function coverageWarnings(
  product: Product,
  income: IncomeSource[],
  deductions: DeductionType[],
): string[] {
  const gaps: string[] = [];
  for (const src of income) {
    const flag = INCOME_TO_FEATURE[src];
    if (flag && !product.supports[flag]) gaps.push(inputLabel(src));
  }
  for (const d of deductions) {
    const flag = DEDUCTION_TO_FEATURE[d];
    if (flag && !product.supports[flag]) gaps.push(inputLabel(d));
  }
  if (gaps.length === 0) return [];
  return [
    `You selected ${joinPlain(gaps)}, which ${product.name} doesn't explicitly cover. Premier (investments, capital gains, foreign income) or an Expert plan (all personal situations) may suit those better.`,
  ];
}

type Draft = {
  productId: string;
  matchedRule: string;
  confidence: Confidence;
  reasons: string[];
  matchedInputs: string[];
  warnings: string[];
  upgradeId?: string;
  upgradeReason?: string;
};

function finalize(draft: Draft): RecommendationResult {
  const product = requireProduct(draft.productId);
  let confidence = draft.confidence;
  // Coverage gaps reduce our confidence in an otherwise-strong match.
  const hasCoverageGap = draft.warnings.some((w) => w.includes("doesn't explicitly cover"));
  if (hasCoverageGap && confidence === "high") confidence = "medium";

  const result: RecommendationResult = {
    recommendedProductId: product.id,
    recommendedProductName: product.name,
    price: product.price,
    currency: product.currency,
    confidence,
    matchedRule: draft.matchedRule,
    reasons: draft.reasons,
    matchedInputs: Array.from(new Set(draft.matchedInputs)),
    disclaimer: DISCLAIMER,
  };

  if (draft.warnings.length > 0) result.warnings = draft.warnings;

  if (draft.upgradeId && draft.upgradeReason) {
    const up = requireProduct(draft.upgradeId);
    result.optionalUpgrade = {
      productId: up.id,
      productName: up.name,
      price: up.price,
      reason: draft.upgradeReason,
    };
  }

  return result;
}

// --- The engine ------------------------------------------------------------

export function recommend(answers: WizardAnswers): RecommendationResult {
  const filingType = answers.filingType ?? "personal";
  const help = answers.helpPreference ?? "self";

  const specificDeductions = answers.deductions.filter((d) => d !== "none");
  const hasNone = answers.deductions.includes("none");
  const income = new Set(answers.incomeSources);
  const deductions = new Set(specificDeductions);

  const baseWarnings: string[] = [];
  if (hasNone && specificDeductions.length > 0) {
    baseWarnings.push(
      "You selected 'No special deductions' together with specific deductions — we used the specific ones you chose.",
    );
  }

  // ---- RULE 1: Incorporated company (overrides all personal products) ----
  if (filingType === "incorporated") {
    const warnings = [...baseWarnings];
    const personalIncome = answers.incomeSources.filter((s) => s !== "businessRevenue");
    if (personalIncome.length > 0) {
      warnings.push(
        "Corporate products cover the company's return only. Personal income you earn is filed separately with a personal plan (e.g. Premier or Self-Employed).",
      );
    }
    if (help !== "self") {
      warnings.push(
        "You also asked for expert help — corporate filing takes priority, so we've recommended the corporate product.",
      );
    }

    if (answers.companyHadRevenue === false) {
      return finalize({
        productId: "nil-corporate",
        matchedRule: "Rule 1 — Incorporated company (no revenue)",
        confidence: "high",
        reasons: [
          "You're filing for an incorporated company that had no revenue.",
          "Nil Corporate Return files a nil (no-revenue) corporate return.",
        ],
        matchedInputs: ["incorporated", "companyNoRevenue"],
        warnings,
      });
    }

    return finalize({
      productId: "business-corporate",
      matchedRule: "Rule 1 — Incorporated company (with revenue)",
      confidence: "high",
      reasons: [
        "You're filing for an incorporated company with revenue.",
        "Business Corporate handles the corporate (T2) return, business income, and expenses.",
      ],
      matchedInputs: ["incorporated", "companyHadRevenue"],
      warnings,
    });
  }

  // ---- RULE 2: Expert Full Service ----
  if (help === "expert_file") {
    return finalize({
      productId: "expert-full-service",
      matchedRule: "Rule 2 — Expert Full Service",
      confidence: "high",
      reasons: [
        "You asked for an expert to prepare and file your return.",
        "Expert Full Service has a tax expert handle filing end-to-end and covers all personal tax situations.",
      ],
      matchedInputs: ["expert_file"],
      warnings: baseWarnings,
    });
  }

  // ---- RULE 3: Expert Assist ----
  if (help === "expert_help") {
    return finalize({
      productId: "expert-assist",
      matchedRule: "Rule 3 — Expert Assist",
      confidence: "high",
      reasons: [
        "You asked for expert help while you file.",
        "Expert Assist adds expert chat, a video call, and a pre-file review to a return you complete yourself.",
      ],
      matchedInputs: ["expert_help"],
      warnings: baseWarnings,
      upgradeId: "expert-full-service",
      upgradeReason: "Prefer to hand it off entirely? Expert Full Service has an expert prepare and file for you.",
    });
  }

  // ---- RULE 4: Self-Employed ----
  const selfEmployedSignals: string[] = [];
  if (filingType === "self_employed") selfEmployedSignals.push("self_employed");
  if (income.has("freelanceIncome")) selfEmployedSignals.push("freelanceIncome");
  if (income.has("gigWorkIncome")) selfEmployedSignals.push("gigWorkIncome");
  if (income.has("businessRevenue")) selfEmployedSignals.push("businessRevenue");
  if (deductions.has("businessExpenses")) selfEmployedSignals.push("businessExpenses");
  if (deductions.has("homeOfficeExpenses")) selfEmployedSignals.push("homeOfficeExpenses");
  if (deductions.has("vehicleExpenses")) selfEmployedSignals.push("vehicleExpenses");

  if (selfEmployedSignals.length > 0) {
    const product = requireProduct("self-employed");
    const primary =
      filingType === "self_employed" ||
      income.has("freelanceIncome") ||
      income.has("gigWorkIncome") ||
      income.has("businessRevenue") ||
      deductions.has("businessExpenses");
    return finalize({
      productId: "self-employed",
      matchedRule: "Rule 4 — Self-Employed",
      confidence: primary ? "high" : "medium",
      reasons: [
        `You selected ${joinLabels(selfEmployedSignals)}.`,
        "Self-Employed covers freelance, gig, and business income along with business, home-office, and vehicle expenses.",
      ],
      matchedInputs: selfEmployedSignals,
      warnings: [
        ...baseWarnings,
        ...coverageWarnings(product, answers.incomeSources, specificDeductions),
      ],
      upgradeId: "expert-assist",
      upgradeReason: "Want a tax expert to review your self-employment return before filing? Expert Assist adds expert chat and a pre-file review.",
    });
  }

  // ---- RULE 5: Premier ----
  const premierSignals: string[] = [];
  if (income.has("investmentIncome")) premierSignals.push("investmentIncome");
  if (income.has("capitalGains")) premierSignals.push("capitalGains");
  if (income.has("rentalIncome")) premierSignals.push("rentalIncome");
  if (income.has("foreignIncome")) premierSignals.push("foreignIncome");

  if (premierSignals.length > 0) {
    return finalize({
      productId: "premier",
      matchedRule: "Rule 5 — Premier",
      confidence: "high",
      reasons: [
        `You selected ${joinLabels(premierSignals)}.`,
        "Premier covers investment income, capital gains, rental income, and foreign income.",
      ],
      matchedInputs: premierSignals,
      warnings: baseWarnings,
      upgradeId: "expert-assist",
      upgradeReason: "Want a pro to check your investment or rental entries? Expert Assist adds expert help while you file.",
    });
  }

  // ---- RULE 6: Deluxe ----
  const deluxeSignals: string[] = [];
  if (deductions.has("medicalExpenses")) deluxeSignals.push("medicalExpenses");
  if (deductions.has("donations")) deluxeSignals.push("donations");
  if (deductions.has("employmentExpenses")) deluxeSignals.push("employmentExpenses");

  if (deluxeSignals.length > 0) {
    return finalize({
      productId: "deluxe",
      matchedRule: "Rule 6 — Deluxe",
      confidence: "high",
      reasons: [
        `You selected ${joinLabels(deluxeSignals)}.`,
        "Deluxe adds common deductions — medical, donations, and employment expenses — to a salaried return.",
      ],
      matchedInputs: deluxeSignals,
      warnings: baseWarnings,
      upgradeId: "expert-assist",
      upgradeReason: "Want a tax expert to double-check your deductions? Expert Assist adds expert help while you file.",
    });
  }

  // ---- RULE 7: Free (simple default) ----
  const simpleIncome = answers.incomeSources.filter(
    (s) => s === "salaryIncome" || s === "studentIncome",
  );
  return finalize({
    productId: "free",
    matchedRule: "Rule 7 — Free",
    confidence: "high",
    reasons: [
      "You have a simple personal return — salary and/or student income with no special deductions, investments, or self-employment.",
      "Free covers basic personal returns at no cost.",
    ],
    matchedInputs: simpleIncome.length > 0 ? simpleIncome : ["personal"],
    warnings: baseWarnings,
  });
}
