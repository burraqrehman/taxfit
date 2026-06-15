# TaxFit — Find the tax software that fits

**🔗 Live demo: [taxfit-theta.vercel.app](https://taxfit-theta.vercel.app/)** · deployed on Vercel

**An AI-assisted product recommendation website for a fictional Canadian tax-software company.**

TaxFit helps users pick the right tax-filing product for their situation. Answer a short
questionnaire and it returns **one** recommended product with the exact reasons behind the
match — or browse the full catalog, compare every plan side-by-side, and ask a grounded AI
assistant the in-between questions.

Built for the **Web Development + AI Interview Assignment** (Quaid-e-Azam Solar Power Pvt Ltd,
IT Officer position). All products, prices, and capabilities are fictional and exist only to
exercise the recommendation logic.

> ⚠️ **Not tax advice.** TaxFit only helps you choose a software *product*. It is not tax,
> legal, or financial advice and never guarantees refunds or outcomes.

---

## ⚡ Quick start

```bash
npm install     # 1. install dependencies
npm run dev     # 2. start the dev server
```

Open **http://localhost:3000** — that's it. **No API keys, no database, no configuration
required.** The AI assistant works fully offline out of the box.

---

## Table of contents

1. [Features at a glance](#features-at-a-glance)
2. [Tech stack](#tech-stack)
3. [Setup & running the app](#setup--running-the-app)
4. [Environment variables (optional)](#environment-variables-optional)
5. [Routes & pages implemented](#routes--pages-implemented)
6. [Project structure](#project-structure)
7. [Product data model](#product-data-model)
8. [Recommendation engine](#recommendation-engine)
9. [AI assistant](#ai-assistant)
10. [AI safety behavior](#ai-safety-behavior)
11. [Admin / config page](#admin--config-page)
12. [Manual verification](#manual-verification)
13. [Automated tests (bonus)](#automated-tests-bonus)
14. [Assumptions & design decisions](#assumptions--design-decisions)
15. [Known limitations](#known-limitations)
16. [Future improvements](#future-improvements)
17. [Use of AI during development](#use-of-ai-during-development)

---

## Features at a glance

| Requirement (brief) | Status | Where |
| --- | --- | --- |
| Landing page (hero, CTAs, preview cards, how-it-works, FAQ) | ✅ | `/` |
| Products catalog | ✅ | `/products` |
| Product comparison table (mobile-readable) | ✅ | `/compare` |
| Multi-step recommendation wizard | ✅ | `/recommend` |
| AI assistant (simulated + optional real LLM) | ✅ | `/assistant` |
| Admin / config page | ✅ | `/admin/products` |
| Structured product data (no hardcoding in UI) | ✅ | `lib/products.ts` |
| Recommendation engine separated from UI | ✅ | `lib/recommendation.ts` |
| Priority rules 1–7 implemented correctly | ✅ | engine + 27 tests |
| Validation + contradiction handling | ✅ | engine + wizard |
| AI safety rules (§12 of the brief) | ✅ | `lib/constants.ts` + assistant |
| REST API routes | ✅ | `/api/products`, `/api/recommend`, `/api/assistant` |

**Bonus features implemented:** automated test suite (27 tests) · localStorage wizard
persistence · product filters / price sort / feature search · JSON export of product config ·
schema validation on the admin page · dark-mode design tokens · zero-config offline operation.

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 14** (App Router) | Pages **and** API routes in one deployable app |
| Language | **TypeScript** (strict mode) | Shared domain types across UI, API, and engine |
| Styling | **Tailwind CSS v3** + hand-built design tokens (light & dark) | Clean, responsive, no heavy UI dependency |
| UI primitives | Hand-rolled (button / card / badge) in the shadcn aesthetic | Reusable components without a library lock-in |
| Icons | `lucide-react` | — |
| Tests | **Vitest** | Fast, zero-config unit testing |
| Fonts | Sora (display) + Inter (body) | — |

**Why Next.js full-stack instead of a separate backend?** The recommendation engine, the
assistant, and the UI all share the *same* TypeScript domain types (`lib/types.ts`), so the
front-end and back-end can never drift. One project means one install, one build, and a
one-click deploy to Vercel. The API routes under `app/api/*` are the backend; the business
logic itself lives in framework-free pure functions (`lib/`) that are unit-tested in isolation.

---

## Setup & running the app

**Prerequisites:** Node.js 18.18+ (Node 20+ recommended) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Development server (hot reload)
npm run dev
# → http://localhost:3000

# 3. Production build + serve
npm run build
npm run start

# 4. Quality gates
npm test            # run the 27-test Vitest suite
npm run typecheck   # strict TypeScript check
npm run lint        # Next.js / ESLint
```

| Page | URL |
| --- | --- |
| Landing | http://localhost:3000/ |
| Products | http://localhost:3000/products |
| Compare | http://localhost:3000/compare |
| Recommendation wizard | http://localhost:3000/recommend |
| AI assistant | http://localhost:3000/assistant |
| Admin / config | http://localhost:3000/admin/products |

### Deployment

**Live at [taxfit-theta.vercel.app](https://taxfit-theta.vercel.app/).**

The app is a standard Next.js project with zero required environment variables — it deploys
to **Vercel** (or Netlify / Render / Railway) with no extra configuration: import the repo,
accept the defaults, deploy. Every push to `main` triggers an automatic redeploy.

---

## Environment variables (optional)

TaxFit runs with **zero configuration**. The assistant uses a deterministic, rule-based
engine by default. Optionally, a real LLM can be enabled for the assistant's free-text
answers:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | No | — | If set, the assistant routes non-safety questions through the Anthropic API instead of the simulated engine. |
| `ANTHROPIC_MODEL` | No | `claude-haiku-4-5-20251001` | Model used when the API key is present. |

Copy `.env.example` to `.env.local` to use it. Security notes:

- The key is read **server-side only** (inside the `/api/assistant` route handler) and is
  **never exposed to the browser or bundled into frontend code**.
- **Safety checks run before any model call** — unsafe prompts never reach the LLM.
- If the API errors, the assistant **falls back to the simulated engine**, so behavior is
  always safe and always available.

---

## Routes & pages implemented

### Pages

| Path | Description |
| --- | --- |
| `/` | Landing page — hero, "Find my product" + "Compare products" CTAs, product preview cards, how-it-works, FAQ |
| `/products` | All 8 products; **filter by category, sort by price, search by feature** (bonus) |
| `/compare` | Full capability matrix for all required comparison rows; horizontally scrollable with a sticky feature column for mobile |
| `/recommend` | The multi-step questionnaire wizard and result screen |
| `/assistant` | The grounded chat assistant with example questions |
| `/admin/products` | Data-driven config view with schema validation + JSON export |

### API

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/products` | — | `{ products: Product[] }` |
| `POST` | `/api/recommend` | `WizardAnswers` | `{ result: RecommendationResult }` or `400 { errors }` |
| `POST` | `/api/assistant` | `{ question: string }` | `{ response: AssistantResponse }` or `400 { error }` |

```bash
# Try the engine directly:
curl -X POST http://localhost:3000/api/recommend \
  -H 'content-type: application/json' \
  -d '{"filingType":"personal","incomeSources":["investmentIncome","rentalIncome"],"deductions":["none"],"helpPreference":"self","companyHadRevenue":null}'
# → recommends Premier, with reasons and matched inputs
```

---

## Project structure

```
app/
  layout.tsx              Root layout (fonts, site header, site footer)
  page.tsx                Landing page
  products/page.tsx       Product catalog (filter / sort / feature search)
  compare/page.tsx        Comparison matrix
  recommend/page.tsx      Recommendation wizard + result screen
  assistant/page.tsx      Chat assistant
  admin/products/page.tsx Read-only product configuration
  api/
    products/route.ts     GET  product catalog
    recommend/route.ts    POST questionnaire → recommendation
    assistant/route.ts    POST question → grounded answer
components/               Reusable UI (header, footer, product card, confidence meter, primitives)
lib/
  types.ts                Shared domain types (single source of truth)
  products.ts             ★ The 8 products as structured data
  features.ts             Feature labels / groups / comparison columns
  options.ts              Questionnaire option definitions
  recommendation.ts       ★ The recommendation engine (pure functions, no UI imports)
  recommendation.test.ts  Vitest suite (27 tests)
  assistant.ts            Simulated assistant + optional LLM path
  constants.ts            Disclaimers + unsafe-prompt signals
  utils.ts                cn(), formatCAD()
```

The two ★ files are the heart of the assignment: structured product data and a
UI-independent rules engine. Everything else renders or transports what they produce.

---

## Product data model

Products are **structured data, never hardcoded into UI components**. All 8 products live in
`lib/products.ts` and conform to the `Product` type. Each capability is a boolean flag in a
`supports` record — this is what the engine, the comparison table, and the admin page read.

```ts
type Product = {
  id: string;
  name: string;
  price: number;
  currency: "CAD";
  category: "personal" | "expert" | "corporate";
  tagline: string;
  description: string;
  bestFor: string[];
  highlights: string[];
  supports: Record<FeatureKey, boolean>; // 18 capability flags
  notSupported: string[];                // verbatim "does not support" notes from the brief
};
```

The catalog (all prices in CAD, exactly as specified in the brief):

| Product | Price | Category | Best for |
| --- | --- | --- | --- |
| Free | CA$0 | personal | Simple salary/student returns |
| Deluxe | CA$30 | personal | Common deductions (medical, donations, employment) |
| Premier | CA$50 | personal | Investments, capital gains, rental, foreign income |
| Self-Employed | CA$70 | personal | Freelancers, contractors, gig workers, sole proprietors |
| Expert Assist | CA$120 | expert | File yourself with expert chat / video / review |
| Expert Full Service | CA$250 | expert | An expert prepares and files for you |
| Nil Corporate Return | CA$175 | corporate | Incorporated companies with no revenue |
| Business Corporate | CA$400 | corporate | Incorporated companies with revenue |

Because every page derives from this one source, changing a price or flipping a capability
flag updates the catalog, the comparison table, the engine, and the admin view simultaneously.

---

## Recommendation engine

The engine is `lib/recommendation.ts` — **pure functions with no UI or framework imports**,
fully unit-testable and reused verbatim by both `POST /api/recommend` and the assistant.
**No recommendation logic lives inside JSX.**

It evaluates the brief's **priority cascade** (§8) and returns the first rule that matches.
Higher rules override lower ones:

| # | Rule | Triggers | Result |
| --- | --- | --- | --- |
| 1 | Incorporated | `filingType = incorporated` | **Business Corporate** — or **Nil Corporate Return** if no revenue. Overrides everything, including expert preferences. |
| 2 | Expert files | "I want an expert to file for me" | **Expert Full Service** |
| 3 | Expert help | "I want expert help while filing" | **Expert Assist** |
| 4 | Self-employed | freelancer filing type, freelance / gig / business income, or business / home-office / vehicle expenses | **Self-Employed** |
| 5 | Premier | investment / capital gains / rental / foreign income | **Premier** |
| 6 | Deluxe | medical / donations / employment expenses | **Deluxe** |
| 7 | Free | simple salary/student return, nothing special | **Free** |

Every result is a structured `RecommendationResult` containing:

- **`reasons`** — plain-language explanation of why the product was chosen
- **`matchedInputs`** — the specific answers that drove the match
- **`matchedRule`** — which rule fired (transparency / debugging)
- **`confidence`** — `high` / `medium` / `low`, downgraded when a coverage gap exists
- **`warnings`** *(optional)* — edge cases worth checking (see below)
- **`optionalUpgrade`** *(optional)* — a relevant higher tier where applicable
- **`disclaimer`** — always present

### Edge cases handled

- **Coverage gaps.** Self-Employed covers business situations but *not* capital gains or
  foreign income. "Freelance + capital gains" still recommends Self-Employed (correct by
  priority) but **warns** about the gap and **downgrades confidence** from high to medium.
- **Contradictory deductions.** "No special deductions" together with a specific deduction
  produces a warning; the engine uses the specific ones. (The wizard also prevents this at
  input time — selecting one clears the other.)
- **Corporate + personal income.** Corporate plans cover the company return only, so personal
  income alongside an incorporated filing triggers a note that it's filed separately.
- **Corporate + expert request.** Corporate filing takes priority over an expert preference;
  the override is explained in a warning rather than silently ignored.
- **Validation (brief §14).** Filing type, ≥1 income source (individuals), help preference,
  and the company-revenue answer (incorporated) are all required. An incorporated nil-return
  is validly allowed to have no income.
- **Defensive defaults.** Missing `filingType` / `helpPreference` default safely so the
  engine never throws on direct API calls.

---

## AI assistant

The assistant (`lib/assistant.ts`) answers free-text product-selection questions and is
**grounded in the product catalog and the same recommendation engine** — it never invents
features, and every answer carries the disclaimer. It is **not a generic chatbot**: every
branch reads the product data.

**Flow:** safety check → classify intent → handle.

| Intent | Example | How it's answered |
| --- | --- | --- |
| `safety` | "Can you guarantee I get a refund?" | Fixed safe refusal — checked **before** everything else |
| `comparison` | "What's the difference between Premier and Self-Employed?" | Diffs the two products' capability flags from the data |
| `eligibility` | "I'm a freelancer with home-office expenses. Can I use Free?" | Runs the engine on the detected situation, reports whether the named product covers it and what does |
| `recommendation` | "I have salary income and donations. Which product should I use?" | Parses the question into the questionnaire model and calls `recommend()` |
| `fallback` | Anything without a detectable signal | Guides the user toward describing their situation |

All six example questions from the brief (§10.5) resolve correctly through these intents.

### Optional real LLM (Option A)

If `ANTHROPIC_API_KEY` is set, non-safety questions are routed to the Anthropic API with a
system prompt that injects the **product catalog (JSON), the priority rules, and the safety
instructions**, and demands structured JSON-only output — exactly the Option A contract in
the brief. The key never reaches the client, safety still short-circuits first, and any API
error falls back to the simulated engine. Without a key, the simulated assistant (Option B)
handles everything.

---

## AI safety behavior

Per §12 of the brief, the assistant must never give real tax/legal/financial advice. This is
enforced **deterministically in code**, not left to a model's judgment:

- Unsafe prompts (refund guarantees, "will the CRA accept", audit avoidance, evasion,
  legal/financial advice requests) are detected via `UNSAFE_USER_SIGNALS` in
  `lib/constants.ts` and met with a fixed refusal **before any other processing or any
  model call**.
- The refusal matches the brief's expected response: *"I cannot guarantee refunds or tax
  outcomes. I can only provide general product guidance based on the product rules."*
- All answers use hedged language ("Based on the provided product rules…", "appears
  suitable…") and **every** response appends the disclaimer.
- The assistant only ever claims capabilities present in the `supports` data — it cannot
  invent features, because answers are assembled from the catalog.

---

## Admin / config page

`/admin/products` is a **read-only, fully data-driven** view of the catalog. For each
product it shows:

- product **ID**, **name**, and **price**
- **best for**
- every capability **grouped by area** (income / deductions / expert / corporate) with
  clear supported ✓ / unsupported ✗ markers
- the verbatim **"does not support"** notes from the brief

Bonus features on this page:

- a lightweight **schema validation** pass over each product that flags missing/invalid
  fields, and
- **export of the full product config as JSON** (one click, downloads the catalog).

It reads the same `lib/products.ts` data as everything else — demonstrating that the data,
not the UI, is the source of truth.

---

## Manual verification

All 11 required scenarios from §15 of the brief were verified by hand in the wizard
(`/recommend`) and the assistant (`/assistant`), and each is **also encoded as an automated
test** so it can be re-verified at any time with `npm test`.

| # | Scenario | Expected | Verified |
| --- | --- | --- | --- |
| 1 | Salary only | **Free** | ✅ |
| 2 | Salary + donations | **Deluxe** | ✅ |
| 3 | Investment income | **Premier** | ✅ |
| 4 | Rental income | **Premier** | ✅ |
| 5 | Freelance income | **Self-Employed** | ✅ |
| 6 | Home-office expenses | **Self-Employed** | ✅ |
| 7 | Wants expert help | **Expert Assist** | ✅ |
| 8 | Wants expert to file | **Expert Full Service** | ✅ |
| 9 | Incorporated company with revenue | **Business Corporate** | ✅ |
| 10 | Incorporated company with no revenue | **Nil Corporate Return** | ✅ |
| 11 | Assistant asked for a refund guarantee | **Safe disclaimer response** | ✅ |

**How each flow was checked manually:**

- **Wizard:** entered each scenario's answers in `/recommend`, confirmed the result screen
  shows the expected product with correct price, reasons, matched inputs, and disclaimer;
  used Back/Next to confirm navigation and per-step validation (cannot proceed with an empty
  required step); refreshed mid-wizard to confirm localStorage persistence; used "Start over"
  to confirm the restart resets state.
- **API:** sent the same payloads to `POST /api/recommend` with `curl` and confirmed
  identical results, plus `400` with field errors for invalid payloads.
- **Assistant:** asked all six example questions from the brief plus the unsafe refund
  question in `/assistant`, confirming grounded answers, comparisons, and the safe refusal.
- **Responsive UI:** checked all pages at mobile width (comparison table scrolls with a
  sticky feature column; wizard and cards stack cleanly).

**Priority-override spot checks (worth trying):**

- Freelance **+** capital gains → Self-Employed, with a **coverage-gap warning** and medium confidence
- Freelance **+** "expert files for me" → Expert Full Service (rule 2 beats rule 4)
- Investment income **+** donations → Premier (rule 5 beats rule 6)
- Incorporated **+** "expert files for me" → Business Corporate (rule 1 beats rule 2, with an explanatory warning)

---

## Automated tests (bonus)

```bash
npm test
```

`lib/recommendation.test.ts` — **27 tests, all passing** — covers:

- all 11 required manual-verification scenarios
- the priority-override rules (corporate > expert > self-employed > premier > deluxe > free)
- output shape: reasons, matched inputs, confidence, disclaimer presence
- the documented edge cases (coverage gap downgrade, contradictory deductions, corporate warnings)
- input validation (required fields, incorporated nil-return exception)
- assistant grounding and safety behavior (refusal fires before everything else)

The full quality gate used before submission: `npm run typecheck` (strict TS, clean) →
`npm test` (27/27) → `npm run build` (production build, clean).

---

## Assumptions & design decisions

- **Self-Employed scope follows the brief literally.** It supports business, freelance, gig,
  investment, and rental income, but **not** capital gains, foreign income, or employment
  expenses. This creates an intentional, *surfaced* coverage-gap edge case (warning +
  confidence downgrade) rather than silently widening the product beyond the spec.
- **Corporate flags are kept clean for comparison.** `corporateFiling` is true only for
  Business Corporate; `nilCorporateReturn` only for Nil Corporate Return — so the comparison
  matrix and admin view stay unambiguous.
- **Income validation applies to individuals only.** Incorporated filings ask "did the
  company have revenue?" instead, which allows a valid nil-return path with no income.
- **Contradictions are handled at two layers.** The wizard prevents "none + specific
  deduction" at input time (good UX); the engine *still* handles it defensively with a
  warning for direct API/assistant calls (robustness).
- **Optional upgrades** are suggested only where they add a clear next step
  (Deluxe / Premier / Self-Employed → Expert Assist; Expert Assist → Expert Full Service).
- **Wizard progress persists** in `localStorage` so a refresh doesn't lose answers;
  "Start over" clears it.

---

## Known limitations

- Products and pricing are **fictional** and simplified; real tax software has far more nuance.
- The simulated assistant uses keyword detection, so very unusual phrasings may fall back to
  the guided prompt. Enabling the optional LLM improves free-text understanding.
- The assistant handles one question at a time and doesn't retain multi-turn conversational
  state between questions.
- There is no persistence layer or auth — the admin page is read-only by design.

---

## Future improvements

- Editable admin (create/update products) backed by a database, with the schema validation
  enforced server-side.
- Multi-turn assistant memory and clarifying follow-up questions.
- Shareable result links and a saved-comparison feature.
- Internationalization — the copy is centralized and ready for it.
- Analytics on which rules fire most, to tune the catalog.
- CI workflow running typecheck + tests + build on every push.

---

## Use of AI during development

AI (Anthropic's **Claude**, via the Claude Code CLI) was used as a development assistant
throughout this project, in the spirit of the assignment.

**What AI was used for:**

- **Architecture & planning** — discussing the trade-offs of a Next.js full-stack approach
  vs. a separate backend, and the priority-cascade design for the engine.
- **Code generation & review** — drafting the engine, the simulated assistant, the API
  routes, and the React/Tailwind UI, then iterating on them.
- **Edge-case discovery** — surfacing cases like the Self-Employed coverage gap and the
  contradictory-deduction handling, which informed the warnings system.
- **Tests & documentation** — generating the Vitest scenarios and this README.

**How the output was reviewed and verified:**

- Every AI-generated change was reviewed by hand and validated against the brief's rules.
- The full quality gate was run repeatedly: strict TypeScript compile (`npm run typecheck`),
  the 27-test suite (`npm test`), and a production build (`npm run build`).
- All 11 required scenarios were manually re-verified in the running app (see
  [Manual verification](#manual-verification)).

**What was done manually:** requirement analysis against the PDF brief, the product/rule
mapping decisions, design direction, final code review, and all manual testing.

**Important:** the product recommendation *logic itself* is deterministic and rule-based —
AI was a tool for building it, not a black box inside it. The optional runtime LLM
integration in the assistant is clearly isolated, gated behind an environment variable, and
wrapped in deterministic safety checks and a fallback.
