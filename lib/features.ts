import type { FeatureKey } from "./types";

/** Human-readable label for every capability flag. */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  salaryIncome: "Salary income",
  studentIncome: "Student income",
  medicalExpenses: "Medical expenses",
  donations: "Donations",
  employmentExpenses: "Employment expenses",
  investmentIncome: "Investment income",
  capitalGains: "Capital gains",
  foreignIncome: "Foreign income",
  rentalIncome: "Rental income",
  freelanceIncome: "Freelance income",
  gigWorkIncome: "Gig-work income",
  businessExpenses: "Business expenses",
  homeOfficeExpenses: "Home-office expenses",
  vehicleExpenses: "Vehicle expenses",
  expertHelp: "Expert help",
  fullService: "Full service (expert files)",
  corporateFiling: "Corporate filing",
  nilCorporateReturn: "Nil return",
};

/** Logical grouping of capabilities for the admin / detail views. */
export const FEATURE_GROUPS: { title: string; keys: FeatureKey[] }[] = [
  {
    title: "Income",
    keys: [
      "salaryIncome",
      "studentIncome",
      "investmentIncome",
      "capitalGains",
      "foreignIncome",
      "rentalIncome",
      "freelanceIncome",
      "gigWorkIncome",
    ],
  },
  {
    title: "Deductions & expenses",
    keys: [
      "medicalExpenses",
      "donations",
      "employmentExpenses",
      "businessExpenses",
      "homeOfficeExpenses",
      "vehicleExpenses",
    ],
  },
  {
    title: "Expert service",
    keys: ["expertHelp", "fullService"],
  },
  {
    title: "Corporate",
    keys: ["corporateFiling", "nilCorporateReturn"],
  },
];

/** Columns shown on the /compare table (per brief §10.3). */
export const COMPARISON_FEATURES: FeatureKey[] = [
  "salaryIncome",
  "donations",
  "medicalExpenses",
  "investmentIncome",
  "rentalIncome",
  "freelanceIncome",
  "businessExpenses",
  "expertHelp",
  "fullService",
  "corporateFiling",
  "nilCorporateReturn",
];
