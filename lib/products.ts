import type { FeatureKey, Product, ProductSupports } from "./types";

// ---------------------------------------------------------------------------
// PRODUCT DATA
//
// This file is the single source of truth for product configuration. UI never
// hardcodes product facts — it reads from here (or the /api/products route,
// which serves this same data). To change a price or capability, edit here.
//
// `supports` is the machine-readable capability matrix. `notSupported` keeps
// the brief's verbatim exclusion notes, some of which (e.g. "full handoff
// filing") aren't part of the boolean flag space.
// ---------------------------------------------------------------------------

export const ALL_FEATURE_KEYS: FeatureKey[] = [
  "salaryIncome",
  "studentIncome",
  "medicalExpenses",
  "donations",
  "employmentExpenses",
  "investmentIncome",
  "capitalGains",
  "foreignIncome",
  "rentalIncome",
  "freelanceIncome",
  "gigWorkIncome",
  "businessExpenses",
  "homeOfficeExpenses",
  "vehicleExpenses",
  "expertHelp",
  "fullService",
  "corporateFiling",
  "nilCorporateReturn",
];

/** All personal-return capabilities (everything except service/corporate). */
const PERSONAL_FEATURE_KEYS: FeatureKey[] = [
  "salaryIncome",
  "studentIncome",
  "medicalExpenses",
  "donations",
  "employmentExpenses",
  "investmentIncome",
  "capitalGains",
  "foreignIncome",
  "rentalIncome",
  "freelanceIncome",
  "gigWorkIncome",
  "businessExpenses",
  "homeOfficeExpenses",
  "vehicleExpenses",
];

/** Build a full supports map: everything false except the listed keys. */
function supports(trueKeys: FeatureKey[]): ProductSupports {
  const base = Object.fromEntries(
    ALL_FEATURE_KEYS.map((k) => [k, false]),
  ) as ProductSupports;
  for (const key of trueKeys) base[key] = true;
  return base;
}

export const PRODUCTS: Product[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "CAD",
    category: "personal",
    tagline: "Simple returns, $0.",
    description:
      "For a straightforward personal return built on salary or student income and basic tax slips.",
    bestFor: ["Users with a simple personal tax situation"],
    highlights: ["Salary income", "Student income", "Basic personal return", "Simple tax slips"],
    supports: supports(["salaryIncome", "studentIncome"]),
    notSupported: [
      "Medical expenses",
      "Donations",
      "Investment income",
      "Rental income",
      "Self-employment income",
      "Business income",
      "Expert help",
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe",
    price: 30,
    currency: "CAD",
    category: "personal",
    tagline: "Common deductions, covered.",
    description:
      "Everything in Free plus the everyday deductions — medical, donations, employment expenses, and family-related credits.",
    bestFor: ["Users with common deductions and expenses"],
    highlights: ["Everything in Free", "Medical expenses", "Donations", "Employment expenses", "Family deductions"],
    supports: supports([
      "salaryIncome",
      "studentIncome",
      "medicalExpenses",
      "donations",
      "employmentExpenses",
    ]),
    notSupported: [
      "Investment income",
      "Rental income",
      "Self-employment income",
      "Corporate tax filing",
    ],
  },
  {
    id: "premier",
    name: "Premier",
    price: 50,
    currency: "CAD",
    category: "personal",
    tagline: "Investments & rental income.",
    description:
      "Everything in Deluxe plus investment income, capital gains, foreign income, and rental income.",
    bestFor: ["Users with investments, rental income, capital gains, or foreign income"],
    highlights: ["Everything in Deluxe", "Investment income", "Capital gains", "Foreign income", "Rental income"],
    supports: supports([
      "salaryIncome",
      "studentIncome",
      "medicalExpenses",
      "donations",
      "employmentExpenses",
      "investmentIncome",
      "capitalGains",
      "foreignIncome",
      "rentalIncome",
    ]),
    notSupported: ["Self-employment income", "Corporate tax filing"],
  },
  {
    id: "self-employed",
    name: "Self-Employed",
    price: 70,
    currency: "CAD",
    category: "personal",
    tagline: "For freelancers & contractors.",
    description:
      "Built for freelancers, contractors, gig workers, and sole proprietors — with business, home-office, and vehicle expenses.",
    bestFor: ["Freelancers, contractors, gig workers, and sole proprietors"],
    highlights: ["Freelance income", "Gig-work income", "Business expenses", "Home-office expenses", "Vehicle expenses"],
    supports: supports([
      "salaryIncome",
      "studentIncome",
      "medicalExpenses",
      "donations",
      "investmentIncome",
      "rentalIncome",
      "freelanceIncome",
      "gigWorkIncome",
      "businessExpenses",
      "homeOfficeExpenses",
      "vehicleExpenses",
    ]),
    notSupported: ["Incorporated business filing"],
  },
  {
    id: "expert-assist",
    name: "Expert Assist",
    price: 120,
    currency: "CAD",
    category: "expert",
    tagline: "File yourself, with a pro on call.",
    description:
      "All personal tax situations, plus expert chat, a video call, and an expert review before you file.",
    bestFor: ["Users who want to file themselves but need help from a tax expert"],
    highlights: ["All personal situations", "Expert chat", "Expert video call", "Expert review before filing"],
    supports: supports([...PERSONAL_FEATURE_KEYS, "expertHelp"]),
    notSupported: ["Full handoff filing", "Incorporated business filing"],
  },
  {
    id: "expert-full-service",
    name: "Expert Full Service",
    price: 250,
    currency: "CAD",
    category: "expert",
    tagline: "An expert files it for you.",
    description:
      "Upload your documents and a tax expert prepares and files your return, with progress tracking throughout.",
    bestFor: ["Users who want an expert to prepare and file their return"],
    highlights: ["Document upload", "Expert prepares return", "Expert files return", "Progress tracking"],
    supports: supports([...PERSONAL_FEATURE_KEYS, "expertHelp", "fullService"]),
    notSupported: ["Incorporated business filing"],
  },
  {
    id: "business-corporate",
    name: "Business Corporate",
    price: 400,
    currency: "CAD",
    category: "corporate",
    tagline: "For incorporated companies.",
    description:
      "A corporate (T2) return for incorporated companies with revenue — business income, expenses, and a corporate filing review.",
    bestFor: ["Incorporated companies"],
    highlights: ["Corporate tax return", "Business revenue", "Business expenses", "Corporate filing review"],
    supports: supports(["businessExpenses", "corporateFiling"]),
    notSupported: ["Personal tax return"],
  },
  {
    id: "nil-corporate",
    name: "Nil Corporate Return",
    price: 175,
    currency: "CAD",
    category: "corporate",
    tagline: "No-revenue corporate filing.",
    description:
      "A nil return for an incorporated company that had no revenue in the year.",
    bestFor: ["Incorporated companies with no revenue"],
    highlights: ["Incorporated company filing", "No-revenue company", "Nil return"],
    supports: supports(["nilCorporateReturn"]),
    notSupported: ["Personal tax return", "Companies with revenue"],
  },
];

// --- Lookups ---------------------------------------------------------------

const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProduct(id: string): Product | undefined {
  return PRODUCT_BY_ID.get(id);
}

/** Throwing accessor for internal use where the id is known-valid. */
export function requireProduct(id: string): Product {
  const product = PRODUCT_BY_ID.get(id);
  if (!product) throw new Error(`Unknown product id: ${id}`);
  return product;
}
