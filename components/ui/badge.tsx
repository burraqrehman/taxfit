import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "accent" | "outline" | "success" | "muted";

const VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-foreground text-background",
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent-foreground",
  success: "bg-primary-soft text-primary",
  outline: "border border-border text-muted-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
