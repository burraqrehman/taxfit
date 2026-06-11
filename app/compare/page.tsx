import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getAllProducts } from "@/lib/products";
import { COMPARISON_FEATURES, FEATURE_LABELS } from "@/lib/features";
import { formatCAD } from "@/lib/utils";

export const metadata = { title: "Compare products" };

export default function ComparePage() {
  const products = getAllProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Compare products
        </h1>
        <p className="mt-2 text-muted-foreground">
          Every plan and capability in one place. On a phone, scroll the table sideways to see all
          plans — the feature column stays put.
        </p>
      </header>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-20 min-w-[160px] border-b border-border bg-card px-4 py-4 text-left align-bottom"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Feature
                  </span>
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className="border-b border-l border-border bg-card px-4 py-4 text-center align-bottom"
                  >
                    <div className="font-display text-sm font-semibold">{p.name}</div>
                    <div className="mt-1 font-display text-lg font-semibold tabular">
                      {formatCAD(p.price)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price row (explicitly requested) */}
              <tr className="bg-muted/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-border bg-muted/40 px-4 py-3 text-left font-medium"
                >
                  Price
                </th>
                {products.map((p) => (
                  <td
                    key={p.id}
                    className="border-b border-l border-border px-4 py-3 text-center font-medium tabular"
                  >
                    {formatCAD(p.price)}
                  </td>
                ))}
              </tr>

              {COMPARISON_FEATURES.map((feature, idx) => (
                <tr key={feature} className={idx % 2 === 1 ? "bg-muted/40" : undefined}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border-b border-border px-4 py-3 text-left font-medium ${
                      idx % 2 === 1 ? "bg-muted/40" : "bg-card"
                    }`}
                  >
                    {FEATURE_LABELS[feature]}
                  </th>
                  {products.map((p) => (
                    <td key={p.id} className="border-b border-l border-border px-4 py-3 text-center">
                      {p.supports[feature] ? (
                        <Check className="mx-auto h-4 w-4 text-primary" aria-label="Supported" />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-muted-foreground/40"
                          aria-label="Not supported"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Not sure which row matters most for you?
        </p>
        <Link href="/recommend" className={buttonVariants({ size: "sm" })}>
          Get a recommendation
        </Link>
      </div>
    </div>
  );
}
