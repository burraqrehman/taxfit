import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 13l5 5L20 7" />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">
        Tax<span className="text-primary">Fit</span>
      </span>
    </Link>
  );
}
