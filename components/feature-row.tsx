import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeatureRow({ label, supported }: { label: string; supported: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {supported ? (
        <Check className="h-4 w-4 shrink-0 text-primary" />
      ) : (
        <Minus className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      )}
      <span className={cn(supported ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </li>
  );
}
