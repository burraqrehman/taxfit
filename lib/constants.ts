// Central place for the legally-cautious copy required by the brief.

export const DISCLAIMER =
  "This recommendation provides general product guidance only and is not tax, legal, or financial advice. Please consult a qualified tax professional for advice about your situation.";

export const SHORT_DISCLAIMER =
  "General product guidance only — not tax, legal, or financial advice.";

/**
 * Phrases the assistant must never produce (see brief §12). Used both to keep
 * our own copy safe and to recognise unsafe user prompts.
 */
export const UNSAFE_USER_SIGNALS = [
  "guarantee",
  "guaranteed",
  "definitely qualify",
  "will i get a refund",
  "get me a refund",
  "maximize my refund",
  "biggest refund",
  "will the cra accept",
  "will i get audited",
  "avoid tax",
  "evade tax",
  "hide income",
  "is this legal advice",
  "give me legal advice",
  "give me tax advice",
  "is this tax advice",
];

export const SAFE_REFUSAL =
  "I can't guarantee refunds, audits, or any tax outcome, and I can't give tax, legal, or financial advice. I can only help you compare TaxFit products and suggest which one appears to fit your situation based on the product rules. For advice about your actual return, please consult a qualified tax professional.";
