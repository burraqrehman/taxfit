"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceMeter } from "@/components/confidence-meter";
import {
  DEDUCTION_OPTIONS,
  FILING_OPTIONS,
  HELP_OPTIONS,
  INCOME_OPTIONS,
  REVENUE_OPTIONS,
  inputLabel,
} from "@/lib/options";
import { recommend } from "@/lib/recommendation";
import { cn, formatCAD } from "@/lib/utils";
import type {
  DeductionType,
  FilingType,
  HelpPreference,
  IncomeSource,
  RecommendationResult,
  WizardAnswers,
} from "@/lib/types";

const STORAGE_KEY = "taxfit:wizard:v1";

type StepKey = "filing" | "income" | "deductions" | "help" | "revenue";

const STEP_META: Record<StepKey, { title: string; subtitle: string }> = {
  filing: {
    title: "What are you filing for?",
    subtitle: "This sets the overall path for your return.",
  },
  income: {
    title: "Which income sources apply?",
    subtitle: "Select all that apply — you can choose more than one.",
  },
  deductions: {
    title: "Any deductions or expenses?",
    subtitle: "Select all that apply, or choose “No special deductions”.",
  },
  help: {
    title: "How much help do you want?",
    subtitle: "From fully DIY to a complete expert handoff.",
  },
  revenue: {
    title: "Did the company have revenue?",
    subtitle: "This decides between a full and a nil corporate return.",
  },
};

const EMPTY: WizardAnswers = {
  filingType: null,
  incomeSources: [],
  deductions: [],
  helpPreference: null,
  companyHadRevenue: null,
};

export default function RecommendPage() {
  const [answers, setAnswers] = useState<WizardAnswers>(EMPTY);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restore in-progress answers (bonus: localStorage persistence)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          answers?: WizardAnswers;
          result?: RecommendationResult | null;
        };
        if (saved.answers) setAnswers({ ...EMPTY, ...saved.answers });
        if (saved.result) setResult(saved.result);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setRestored(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, result }));
    } catch {
      /* storage may be unavailable */
    }
  }, [answers, result, restored]);

  const activeSteps: StepKey[] = useMemo(() => {
    const base: StepKey[] = ["filing", "income", "deductions", "help"];
    if (answers.filingType === "incorporated") base.push("revenue");
    return base;
  }, [answers.filingType]);

  const index = Math.min(stepIndex, activeSteps.length - 1);
  const currentStep = activeSteps[index];

  function update(patch: Partial<WizardAnswers>) {
    setAnswers((a) => ({ ...a, ...patch }));
    setError(null);
  }

  function setFiling(v: FilingType) {
    update({
      filingType: v,
      companyHadRevenue: v === "incorporated" ? answers.companyHadRevenue : null,
    });
  }

  function toggleIncome(v: IncomeSource) {
    setError(null);
    setAnswers((a) => ({
      ...a,
      incomeSources: a.incomeSources.includes(v)
        ? a.incomeSources.filter((x) => x !== v)
        : [...a.incomeSources, v],
    }));
  }

  function toggleDeduction(v: DeductionType) {
    setError(null);
    setAnswers((a) => {
      let next: DeductionType[];
      if (v === "none") {
        next = a.deductions.includes("none") ? [] : ["none"];
      } else {
        const without = a.deductions.filter((x) => x !== "none");
        next = without.includes(v) ? without.filter((x) => x !== v) : [...without, v];
      }
      return { ...a, deductions: next };
    });
  }

  function validateStep(): string | null {
    switch (currentStep) {
      case "filing":
        return answers.filingType ? null : "Please choose what you're filing for.";
      case "income":
        return answers.filingType !== "incorporated" && answers.incomeSources.length === 0
          ? "Select at least one income source."
          : null;
      case "deductions":
        return answers.deductions.length === 0
          ? "Select at least one option (or “No special deductions”)."
          : null;
      case "help":
        return answers.helpPreference ? null : "Tell us how much help you'd like.";
      case "revenue":
        return answers.companyHadRevenue === null
          ? "Let us know whether the company had revenue."
          : null;
      default:
        return null;
    }
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (res.ok) {
        const data = (await res.json()) as { result: RecommendationResult };
        setResult(data.result);
      } else {
        setResult(recommend(answers)); // graceful fallback to local engine
      }
    } catch {
      setResult(recommend(answers));
    } finally {
      setLoading(false);
    }
  }

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    if (index < activeSteps.length - 1) {
      setStepIndex(index + 1);
      setError(null);
    } else {
      void submit();
    }
  }

  function back() {
    if (index > 0) {
      setStepIndex(index - 1);
      setError(null);
    }
  }

  function restart() {
    setAnswers(EMPTY);
    setResult(null);
    setStepIndex(0);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  if (result) {
    return <ResultView result={result} answers={answers} onRestart={restart} />;
  }

  const meta = STEP_META[currentStep];
  const isLast = index === activeSteps.length - 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            Step {index + 1} of {activeSteps.length}
          </span>
          <Link href="/products" className="text-muted-foreground hover:text-foreground">
            Skip to products
          </Link>
        </div>
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={activeSteps.length}>
          {activeSteps.map((s, i) => (
            <div
              key={s}
              className={cn("h-1.5 flex-1 rounded-full", i <= index ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
      </div>

      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{meta.title}</h1>
      <p className="mt-1.5 text-muted-foreground">{meta.subtitle}</p>

      <div className="mt-6 space-y-3">
        {currentStep === "filing" &&
          FILING_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              title={o.label}
              description={o.description}
              selected={answers.filingType === o.value}
              onClick={() => setFiling(o.value)}
            />
          ))}

        {currentStep === "income" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {INCOME_OPTIONS.map((o) => (
              <OptionCard
                key={o.value}
                title={o.label}
                multi
                selected={answers.incomeSources.includes(o.value)}
                onClick={() => toggleIncome(o.value)}
              />
            ))}
          </div>
        )}

        {currentStep === "deductions" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {DEDUCTION_OPTIONS.map((o) => (
              <OptionCard
                key={o.value}
                title={o.label}
                multi
                selected={answers.deductions.includes(o.value)}
                onClick={() => toggleDeduction(o.value)}
              />
            ))}
          </div>
        )}

        {currentStep === "help" &&
          HELP_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              title={o.label}
              description={o.description}
              selected={answers.helpPreference === o.value}
              onClick={() => update({ helpPreference: o.value as HelpPreference })}
            />
          ))}

        {currentStep === "revenue" &&
          REVENUE_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              title={o.label}
              selected={
                (o.value === "yes" && answers.companyHadRevenue === true) ||
                (o.value === "no" && answers.companyHadRevenue === false)
              }
              onClick={() => update({ companyHadRevenue: o.value === "yes" })}
            />
          ))}
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 text-sm text-danger">
          <TriangleAlert className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={index === 0}
          className={buttonVariants({ variant: "ghost", className: index === 0 ? "invisible" : "" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button type="button" onClick={next} disabled={loading} className={buttonVariants()}>
          {loading ? "Finding your match…" : isLast ? "See my recommendation" : "Next"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// --- Option card -----------------------------------------------------------

function OptionCard({
  title,
  description,
  selected,
  onClick,
  multi = false,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-primary-soft"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center border",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>}
      </span>
    </button>
  );
}

// --- Result view -----------------------------------------------------------

function ResultView({
  result,
  answers,
  onRestart,
}: {
  result: RecommendationResult;
  answers: WizardAnswers;
  onRestart: () => void;
}) {
  const selections = [
    answers.filingType,
    ...answers.incomeSources,
    ...answers.deductions,
    answers.helpPreference,
    answers.companyHadRevenue === true
      ? "companyHadRevenue"
      : answers.companyHadRevenue === false
        ? "companyNoRevenue"
        : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Badge variant="primary" className="mb-4 animate-fade-up">
        <Sparkles className="h-3.5 w-3.5" />
        Your recommendation
      </Badge>

      <Card className="animate-scale-in overflow-hidden shadow-lift">
        <div className="border-b border-border bg-primary/5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Recommended product</p>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
                {result.recommendedProductName}
              </h1>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-semibold tabular">
                {formatCAD(result.price)}
              </div>
              <div className="text-sm text-muted-foreground">
                {result.price > 0 ? "per return" : "free"}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <ConfidenceMeter confidence={result.confidence} />
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why this fits
            </h2>
            <ul className="mt-3 space-y-2">
              {result.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Based on your answers
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {selections.map((s) => (
                <Badge key={s} variant="muted">
                  {inputLabel(s)}
                </Badge>
              ))}
            </div>
          </section>

          {result.warnings && result.warnings.length > 0 && (
            <section className="rounded-xl border border-warning/40 bg-warning/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TriangleAlert className="h-4 w-4 text-warning" />
                Worth checking
              </div>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          {result.optionalUpgrade && (
            <section className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Optional upgrade · {result.optionalUpgrade.productName}{" "}
                <span className="tabular text-muted-foreground">
                  ({formatCAD(result.optionalUpgrade.price)})
                </span>
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{result.optionalUpgrade.reason}</p>
            </section>
          )}

          <p className="rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
            {result.disclaimer}
          </p>
        </div>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onRestart} className={buttonVariants({ variant: "outline" })}>
          <RotateCcw className="h-4 w-4" />
          Start over
        </button>
        <Link href="/compare" className={buttonVariants({ variant: "ghost" })}>
          Compare all products
        </Link>
        <Link href="/assistant" className={buttonVariants({ variant: "ghost" })}>
          Ask the assistant
        </Link>
      </div>
    </div>
  );
}
