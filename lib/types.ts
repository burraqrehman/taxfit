// ---------------------------------------------------------------------------
// Shared domain types. Imported by the recommendation engine, the assistant,
// the API route handlers, and the UI — so front-end and back-end never drift.
// ---------------------------------------------------------------------------

/** Every boolean capability a product can support. */
export type FeatureKey =
  | "salaryIncome"
  | "studentIncome"
  | "medicalExpenses"
  | "donations"
  | "employmentExpenses"
  | "investmentIncome"
  | "capitalGains"
  | "foreignIncome"
  | "rentalIncome"
  | "freelanceIncome"
  | "gigWorkIncome"
  | "businessExpenses"
  | "homeOfficeExpenses"
  | "vehicleExpenses"
  | "expertHelp"
  | "fullService"
  | "corporateFiling"
  | "nilCorporateReturn";

export type ProductSupports = Record<FeatureKey, boolean>;

export type ProductCategory = "personal" | "expert" | "corporate";

export type Product = {
  id: string;
  name: string;
  price: number;
  currency: "CAD";
  category: ProductCategory;
  tagline: string;
  description: string;
  bestFor: string[];
  /** Headline, human-readable selling points for product cards. */
  highlights: string[];
  supports: ProductSupports;
  /** Verbatim "does not support" notes from the brief (some aren't flags). */
  notSupported: string[];
};

// --- Questionnaire (wizard) input model -----------------------------------

export type FilingType = "personal" | "self_employed" | "incorporated";

export type IncomeSource =
  | "salaryIncome"
  | "studentIncome"
  | "investmentIncome"
  | "capitalGains"
  | "rentalIncome"
  | "freelanceIncome"
  | "gigWorkIncome"
  | "businessRevenue"
  | "foreignIncome";

export type DeductionType =
  | "medicalExpenses"
  | "donations"
  | "employmentExpenses"
  | "homeOfficeExpenses"
  | "vehicleExpenses"
  | "businessExpenses"
  | "none";

export type HelpPreference = "self" | "expert_help" | "expert_file";

export type WizardAnswers = {
  filingType: FilingType | null;
  incomeSources: IncomeSource[];
  deductions: DeductionType[];
  helpPreference: HelpPreference | null;
  /** Only relevant when filingType === "incorporated". */
  companyHadRevenue: boolean | null;
};

// --- Recommendation output -------------------------------------------------

export type Confidence = "low" | "medium" | "high";

export type RecommendationResult = {
  recommendedProductId: string;
  recommendedProductName: string;
  price: number;
  currency: "CAD";
  confidence: Confidence;
  /** Which priority rule produced the match — useful for transparency/debugging. */
  matchedRule: string;
  reasons: string[];
  matchedInputs: string[];
  optionalUpgrade?: {
    productId: string;
    productName: string;
    price: number;
    reason: string;
  };
  warnings?: string[];
  disclaimer: string;
};

export type ValidationError = { field: string; message: string };

// --- Assistant -------------------------------------------------------------

export type AssistantIntent =
  | "recommendation"
  | "comparison"
  | "eligibility"
  | "safety"
  | "fallback";

export type AssistantResponse = {
  answer: string;
  intent: AssistantIntent;
  recommendedProduct?: string;
  comparedProducts?: string[];
  confidence?: Confidence;
  reasons: string[];
  disclaimer: string;
  /** Whether the answer came from the rule engine or a real LLM. */
  source: "simulated" | "ai";
};
