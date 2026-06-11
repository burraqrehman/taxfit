import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CategoryBadge } from "@/components/category-badge";
import { cn, formatCAD } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  featured = false,
}: {
  product: Product;
  featured?: boolean;
}) {
  return (
    <Card className={cn("flex h-full flex-col", featured && "ring-2 ring-primary")}>
      <div className="flex grow flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight">{product.name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{product.tagline}</p>
          </div>
          <CategoryBadge category={product.category} />
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-display text-3xl font-semibold tabular">{formatCAD(product.price)}</span>
          {product.price > 0 && <span className="text-sm text-muted-foreground">/ return</span>}
        </div>

        <p className="text-sm text-muted-foreground">{product.description}</p>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Best for</p>
          <p className="mt-1 text-sm">{product.bestFor.join(", ")}</p>
        </div>

        <ul className="mt-auto space-y-1.5 pt-2">
          {product.highlights.slice(0, 4).map((h) => (
            <li key={h} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 pt-0">
        <Link
          href="/recommend"
          className={buttonVariants({
            variant: featured ? "primary" : "outline",
            className: "w-full",
          })}
        >
          Check my fit
        </Link>
      </div>
    </Card>
  );
}
