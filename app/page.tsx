import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { ConfidenceMeter } from "@/components/confidence-meter";
import { getAllProducts, requireProduct } from "@/lib/products";
import { formatCAD } from "@/lib/utils";

const PREVIEW_IDS = ["free", "premier", "self-employed", "expert-full-service"];

const STEPS = [
  {
    title: "Answer a few questions",
    body: "Tell us your filing type, income sources, deductions, and how much help you want. Two minutes, no account.",
  },
  {
    title: "See your match — and why",
    body: "Get one recommended product with the exact reasons, your matched answers, and a confidence rating.",
  },
  {
    title: "Compare and decide",
    body: "Line products up side by side, or ask the assistant follow-up questions before you commit.",
  },
];

const FAQS = [
  {
    q: "How does the recommendation work?",
    a: "A rule engine maps your answers to products using a fixed priority order — incorporated filings first, then expert service, then self-employment, investments, deductions, and finally a simple free return. You always see which rule matched and why.",
  },
  {
    q: "Is this tax advice?",
    a: "No. TaxFit only helps you choose a software product based on the product rules. It is not tax, legal, or financial advice, and it never guarantees refunds or outcomes. For advice about your return, consult a qualified tax professional.",
  },
  {
    q: "What do the products cost?",
    a: "Plans range from a free simple return up to expert full service and corporate filings. Every price is shown in CAD up front, with no hidden tiers.",
  },
  {
    q: "Can I just compare everything myself?",
    a: "Yes — the compare page puts every product and capability in one table, and the assistant can answer specific 'which one covers X?' questions.",
  },
];

export default function HomePage() {
  const previews = PREVIEW_IDS.map((id) => requireProduct(id));
  const sample = requireProduct("self-employed");
  const total = getAllProducts().length;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div className="animate-fade-up">
            <Badge variant="primary" className="mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Product guidance, not tax advice
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Find the tax software that <span className="text-primary">fits</span> you.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Answer a few quick questions and get one clear recommendation — with the reasons behind
              it, a side-by-side comparison, and an assistant for the in-between questions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/recommend" className={buttonVariants({ size: "lg" })}>
                Find my product
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/compare" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Compare products
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" /> {total} products
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" /> CAD pricing, shown up front
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Grounded in product rules
              </span>
            </div>
          </div>

          {/* Sample result — previews the signature reveal */}
          <div className="animate-scale-in">
            <Card className="shadow-lift">
              <div className="flex items-center justify-between border-b border-border p-5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Your match
                </span>
                <Badge variant="accent">Example</Badge>
              </div>
              <div className="space-y-5 p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold tracking-tight">{sample.name}</h2>
                    <p className="text-sm text-muted-foreground">{sample.tagline}</p>
                  </div>
                  <span className="font-display text-2xl font-semibold tabular">
                    {formatCAD(sample.price)}
                  </span>
                </div>
                <ConfidenceMeter confidence="high" />
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    You selected freelance income and home-office expenses.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Self-Employed covers freelance, gig, and business income with those expenses.
                  </li>
                </ul>
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  General product guidance only — not tax, legal, or financial advice.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                A plan for every situation
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                From a simple free return to full corporate filing — here are a few to start with.
              </p>
            </div>
            <Link href="/products" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              See all {total} products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {previews.map((p) => (
              <ProductCard key={p.id} product={p} featured={p.id === "self-employed"} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              <span className="font-display text-sm font-semibold text-primary">
                0{i + 1}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/recommend" className={buttonVariants()}>
            Start the questionnaire
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently asked
          </h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group px-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-medium marker:content-none">
                  {faq.q}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="pb-4 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
