"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Sparkles, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssistantResponse, Confidence } from "@/lib/types";

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; data: AssistantResponse };

const EXAMPLES = [
  "I have salary income and donations. Which product should I use?",
  "I am a freelancer with home-office expenses. Can I use Free?",
  "I own an incorporated company with no revenue. What should I choose?",
  "I have investment income and rental income. Which product fits me?",
  "What is the difference between Premier and Self-Employed?",
  "I want someone else to file for me. What should I select?",
];

const GREETING: AssistantResponse = {
  answer:
    "Hi! I can help you choose a TaxFit product. Describe your situation — income, deductions, and how much help you'd like — or pick one of the examples below.",
  intent: "fallback",
  reasons: [],
  disclaimer: "General product guidance only — not tax, legal, or financial advice.",
  source: "simulated",
};

const CONFIDENCE_VARIANT: Record<Confidence, "primary" | "accent" | "muted"> = {
  high: "primary",
  medium: "accent",
  low: "muted",
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", data: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasUserMessage = messages.some((m) => m.role === "user");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as { response?: AssistantResponse; error?: string };
      if (data.response) {
        setMessages((m) => [...m, { role: "assistant", data: data.response! }]);
      } else {
        throw new Error(data.error ?? "No response");
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          data: {
            answer:
              "Something went wrong reaching the assistant. Please try again, or use the recommendation wizard.",
            intent: "fallback",
            reasons: [],
            disclaimer: "General product guidance only — not tax, legal, or financial advice.",
            source: "simulated",
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <header className="py-8">
        <Badge variant="primary" className="mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          Product assistant
        </Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Ask about products</h1>
        <p className="mt-2 text-muted-foreground">
          Grounded in the product rules — it suggests a fit and explains why, but never gives tax
          advice or guarantees outcomes.
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 pb-4">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {m.text}
              </div>
            </div>
          ) : (
            <AssistantBubble key={i} data={m.data} />
          ),
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-1">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </span>
            Checking the product rules…
          </div>
        )}

        {!hasUserMessage && (
          <div className="flex flex-wrap gap-2 pt-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => send(ex)}
                className="rounded-full border border-border bg-card px-3.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="sticky bottom-0 z-10 border-t border-border bg-background/90 py-4 backdrop-blur"
      >
        <div className="flex items-center gap-2 rounded-full border border-input bg-card p-1.5 pl-4 shadow-soft">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your tax situation…"
            aria-label="Ask the product assistant"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function AssistantBubble({ data }: { data: AssistantResponse }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-3 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-soft">
        <p className="text-sm">{data.answer}</p>

        {(data.recommendedProduct || data.confidence || data.comparedProducts) && (
          <div className="flex flex-wrap items-center gap-2">
            {data.recommendedProduct && (
              <Badge variant="primary">Suggested: {data.recommendedProduct}</Badge>
            )}
            {data.confidence && (
              <Badge variant={CONFIDENCE_VARIANT[data.confidence]}>
                {data.confidence} confidence
              </Badge>
            )}
            {data.comparedProducts?.map((p) => (
              <Badge key={p} variant="muted">
                {p}
              </Badge>
            ))}
          </div>
        )}

        {data.reasons.length > 0 && (
          <ul className="space-y-1.5">
            {data.reasons.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="flex items-start gap-1.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {data.disclaimer}
        </p>
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  );
}
