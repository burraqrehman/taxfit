import { cn } from "@/lib/utils";
import type { Confidence } from "@/lib/types";

const STEPS: Confidence[] = ["low", "medium", "high"];
const LEVEL: Record<Confidence, number> = { low: 1, medium: 2, high: 3 };
const LABEL: Record<Confidence, string> = {
  low: "Low confidence",
  medium: "Good match",
  high: "Strong match",
};

export function ConfidenceMeter({ confidence }: { confidence: Confidence }) {
  const level = LEVEL[confidence];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Match confidence
        </span>
        <span className="text-sm font-semibold text-primary">{LABEL[confidence]}</span>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-2 flex-1 origin-left rounded-full",
              i < level ? "animate-grow-bar bg-primary" : "bg-muted",
            )}
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
