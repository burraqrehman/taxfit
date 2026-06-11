import type {
  DeductionType,
  FilingType,
  HelpPreference,
  IncomeSource,
} from "./types";

type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export const FILING_OPTIONS: Option<FilingType>[] = [
  {
    value: "personal",
    label: "Personal return",
    description: "Filing your own individual taxes.",
  },
  {
    value: "self_employed",
    label: "Freelancer / self-employed",
    description: "You earn freelance, contract, or gig income.",
  },
  {
    value: "incorporated",
    label: "Incorporated company",
    description: "Filing for a registered corporation.",
  },
];

export const INCOME_OPTIONS: Option<IncomeSource>[] = [
  { value: "salaryIncome", label: "Salary income" },
  { value: "studentIncome", label: "Student income" },
  { value: "investmentIncome", label: "Investment income" },
  { value: "capitalGains", label: "Capital gains" },
  { value: "rentalIncome", label: "Rental income" },
  { value: "freelanceIncome", label: "Freelance income" },
  { value: "gigWorkIncome", label: "Gig-work income" },
  { value: "businessRevenue", label: "Business revenue" },
  { value: "foreignIncome", label: "Foreign income" },
];

export const DEDUCTION_OPTIONS: Option<DeductionType>[] = [
  { value: "medicalExpenses", label: "Medical expenses" },
  { value: "donations", label: "Donations" },
  { value: "employmentExpenses", label: "Employment expenses" },
  { value: "homeOfficeExpenses", label: "Home-office expenses" },
  { value: "vehicleExpenses", label: "Vehicle expenses" },
  { value: "businessExpenses", label: "Business expenses" },
  { value: "none", label: "No special deductions" },
];

export const HELP_OPTIONS: Option<HelpPreference>[] = [
  {
    value: "self",
    label: "I want to file myself",
    description: "Do it on your own with the software.",
  },
  {
    value: "expert_help",
    label: "I want expert help while filing",
    description: "File yourself with a tax expert on call.",
  },
  {
    value: "expert_file",
    label: "I want an expert to file for me",
    description: "Hand it off — an expert prepares and files.",
  },
];

export const REVENUE_OPTIONS: Option<"yes" | "no">[] = [
  { value: "yes", label: "Yes, the company had revenue" },
  { value: "no", label: "No, the company had no revenue" },
];

// --- Flat label lookup (used by the result screen + assistant) -------------

export const INPUT_LABELS: Record<string, string> = {
  // filing
  personal: "Personal return",
  self_employed: "Freelancer / self-employed",
  incorporated: "Incorporated company",
  // income
  salaryIncome: "Salary income",
  studentIncome: "Student income",
  investmentIncome: "Investment income",
  capitalGains: "Capital gains",
  rentalIncome: "Rental income",
  freelanceIncome: "Freelance income",
  gigWorkIncome: "Gig-work income",
  businessRevenue: "Business revenue",
  foreignIncome: "Foreign income",
  // deductions
  medicalExpenses: "Medical expenses",
  donations: "Donations",
  employmentExpenses: "Employment expenses",
  homeOfficeExpenses: "Home-office expenses",
  vehicleExpenses: "Vehicle expenses",
  businessExpenses: "Business expenses",
  none: "No special deductions",
  // help
  self: "File myself",
  expert_help: "Expert help while filing",
  expert_file: "Expert files for me",
  // revenue
  companyHadRevenue: "Company had revenue",
  companyNoRevenue: "Company had no revenue",
};

export function inputLabel(key: string): string {
  return INPUT_LABELS[key] ?? key;
}
