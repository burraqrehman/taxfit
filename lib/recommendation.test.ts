import { describe, expect, it } from "vitest";
import { recommend, validateAnswers } from "./recommendation";
import { askAssistantSimulated } from "./assistant";
import type { WizardAnswers } from "./types";

function answers(partial: Partial<WizardAnswers>): WizardAnswers {
  return {
    filingType: null,
    incomeSources: [],
    deductions: [],
    helpPreference: null,
    companyHadRevenue: null,
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// §15 Manual-verification scenarios (the required table)
// ---------------------------------------------------------------------------

describe("recommendation engine — required scenarios", () => {
  it("salary only → Free", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["salaryIncome"], deductions: ["none"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("free");
  });

  it("salary + donations → Deluxe", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["salaryIncome"], deductions: ["donations"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("deluxe");
  });

  it("investment income → Premier", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["investmentIncome"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("premier");
  });

  it("rental income → Premier", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["rentalIncome"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("premier");
  });

  it("freelance income → Self-Employed", () => {
    const r = recommend(answers({ filingType: "self_employed", incomeSources: ["freelanceIncome"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("self-employed");
  });

  it("home-office expenses → Self-Employed", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["salaryIncome"], deductions: ["homeOfficeExpenses"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("self-employed");
  });

  it("wants expert help → Expert Assist", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["salaryIncome"], helpPreference: "expert_help" }));
    expect(r.recommendedProductId).toBe("expert-assist");
  });

  it("wants expert to file → Expert Full Service", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["salaryIncome"], helpPreference: "expert_file" }));
    expect(r.recommendedProductId).toBe("expert-full-service");
  });

  it("incorporated with revenue → Business Corporate", () => {
    const r = recommend(answers({ filingType: "incorporated", companyHadRevenue: true, helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("business-corporate");
  });

  it("incorporated with no revenue → Nil Corporate Return", () => {
    const r = recommend(answers({ filingType: "incorporated", companyHadRevenue: false, helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("nil-corporate");
  });

  it("refund-guarantee question → safe response", () => {
    const res = askAssistantSimulated("Can you guarantee I will get a refund?");
    expect(res.intent).toBe("safety");
    expect(res.recommendedProduct).toBeUndefined();
    expect(res.answer.toLowerCase()).toMatch(/can.?t guarantee|cannot guarantee/);
    expect(res.disclaimer).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Priority ordering — higher rules override lower ones
// ---------------------------------------------------------------------------

describe("recommendation engine — priority overrides", () => {
  it("incorporated overrides an expert-file preference", () => {
    const r = recommend(answers({ filingType: "incorporated", companyHadRevenue: true, helpPreference: "expert_file" }));
    expect(r.recommendedProductId).toBe("business-corporate");
  });

  it("expert-file overrides self-employment signals", () => {
    const r = recommend(answers({ filingType: "self_employed", incomeSources: ["freelanceIncome"], helpPreference: "expert_file" }));
    expect(r.recommendedProductId).toBe("expert-full-service");
  });

  it("self-employment overrides investment (Premier)", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["freelanceIncome", "investmentIncome"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("self-employed");
  });

  it("investment (Premier) overrides donations (Deluxe)", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["investmentIncome"], deductions: ["donations"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("premier");
  });
});

// ---------------------------------------------------------------------------
// Output shape, reasons, confidence, edge cases
// ---------------------------------------------------------------------------

describe("recommendation engine — output and edge cases", () => {
  it("always returns reasons and a disclaimer", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["salaryIncome"], deductions: ["none"], helpPreference: "self" }));
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.disclaimer).toBeTruthy();
    expect(r.matchedInputs).toContain("salaryIncome");
  });

  it("flags a coverage gap when Self-Employed can't cover capital gains", () => {
    const r = recommend(answers({ filingType: "self_employed", incomeSources: ["freelanceIncome", "capitalGains"], helpPreference: "self" }));
    expect(r.recommendedProductId).toBe("self-employed");
    expect(r.warnings && r.warnings.length).toBeTruthy();
    expect(r.confidence).toBe("medium"); // downgraded by the gap
  });

  it("warns on the no-deductions contradiction", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["salaryIncome"], deductions: ["none", "medicalExpenses"], helpPreference: "self" }));
    expect(r.warnings?.some((w) => /no special deductions/i.test(w))).toBe(true);
  });

  it("suggests an optional upgrade from Deluxe toward Expert Assist", () => {
    const r = recommend(answers({ filingType: "personal", incomeSources: ["salaryIncome"], deductions: ["donations"], helpPreference: "self" }));
    expect(r.optionalUpgrade?.productId).toBe("expert-assist");
  });
});

// ---------------------------------------------------------------------------
// Validation (§14)
// ---------------------------------------------------------------------------

describe("validation", () => {
  it("requires a filing type", () => {
    const errs = validateAnswers(answers({ incomeSources: ["salaryIncome"], helpPreference: "self" }));
    expect(errs.some((e) => e.field === "filingType")).toBe(true);
  });

  it("requires at least one income source for personal filings", () => {
    const errs = validateAnswers(answers({ filingType: "personal", helpPreference: "self" }));
    expect(errs.some((e) => e.field === "incomeSources")).toBe(true);
  });

  it("requires a help preference", () => {
    const errs = validateAnswers(answers({ filingType: "personal", incomeSources: ["salaryIncome"] }));
    expect(errs.some((e) => e.field === "helpPreference")).toBe(true);
  });

  it("requires the revenue answer for incorporated filings", () => {
    const errs = validateAnswers(answers({ filingType: "incorporated", helpPreference: "self" }));
    expect(errs.some((e) => e.field === "companyHadRevenue")).toBe(true);
  });

  it("accepts a valid incorporated nil-return path with no income", () => {
    const errs = validateAnswers(answers({ filingType: "incorporated", companyHadRevenue: false, helpPreference: "self" }));
    expect(errs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Assistant grounding & safety
// ---------------------------------------------------------------------------

describe("assistant", () => {
  it("grounds an investment + rental question in Premier", () => {
    const res = askAssistantSimulated("I have investment income and rental income. Which product fits me?");
    expect(res.recommendedProduct).toBe("Premier");
    expect(res.disclaimer).toBeTruthy();
  });

  it("does not recommend Free to a freelancer with home-office expenses", () => {
    const res = askAssistantSimulated("I am a freelancer with home-office expenses. Can I use Free?");
    expect(res.recommendedProduct).toBe("Self-Employed");
  });

  it("refuses to invent a guaranteed outcome", () => {
    const res = askAssistantSimulated("Guarantee I qualify for this deduction");
    expect(res.intent).toBe("safety");
  });
});
