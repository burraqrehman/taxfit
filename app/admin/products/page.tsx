"use client";

import { Check, Download, Minus, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/category-badge";
import { ALL_FEATURE_KEYS, getAllProducts } from "@/lib/products";
import { FEATURE_GROUPS, FEATURE_LABELS } from "@/lib/features";
import { formatCAD } from "@/lib/utils";
import type { Product } from "@/lib/types";

// Lightweight schema check — demonstrates the data is validated, not assumed.
function validateProduct(p: Product): string[] {
  const issues: string[] = [];
  if (!p.id) issues.push("Missing id");
  if (!p.name) issues.push("Missing name");
  if (!Number.isFinite(p.price) || p.price < 0) issues.push("Invalid price");
  if (p.currency !== "CAD") issues.push("Currency must be CAD");
  if (!p.bestFor || p.bestFor.length === 0) issues.push("Missing “best for”");
  for (const key of ALL_FEATURE_KEYS) {
    if (typeof p.supports[key] !== "boolean") issues.push(`Missing flag: ${key}`);
  }
  return issues;
}

export default function AdminProductsPage() {
  const products = getAllProducts();

  function exportJson() {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taxfit-products.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Product configuration
          </h1>
          <p className="mt-2 text-muted-foreground">
            A read-only view generated directly from the product data file. Every card, comparison,
            and recommendation is driven by this same structured data.
          </p>
        </div>
        <Button variant="outline" onClick={exportJson}>
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
      </header>

      <div className="mt-8 space-y-5">
        {products.map((p) => {
          const issues = validateProduct(p);
          return (
            <Card key={p.id} className="p-6">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold tracking-tight">{p.name}</h2>
                    <CategoryBadge category={p.category} />
                  </div>
                  <code className="mt-1 block text-xs text-muted-foreground">id: {p.id}</code>
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Best for
                    </p>
                    <p className="mt-1 text-sm">{p.bestFor.join(", ")}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="font-display text-2xl font-semibold tabular">
                    {formatCAD(p.price)}
                  </span>
                  {issues.length === 0 ? (
                    <Badge variant="success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Schema valid
                    </Badge>
                  ) : (
                    <Badge variant="muted" className="text-danger">
                      {issues.length} issue{issues.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>

              {issues.length > 0 && (
                <ul className="mt-4 list-inside list-disc text-sm text-danger">
                  {issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}

              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.title}
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {group.keys.map((key) => {
                        const ok = p.supports[key];
                        return (
                          <li key={key} className="flex items-center gap-2 text-sm">
                            {ok ? (
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                            ) : (
                              <Minus className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                            )}
                            <span className={ok ? "" : "text-muted-foreground"}>
                              {FEATURE_LABELS[key]}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {p.notSupported.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Does not support (from spec)
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.notSupported.join(" · ")}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
