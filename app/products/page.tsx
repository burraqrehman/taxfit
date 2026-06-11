"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ALL_FEATURE_KEYS, getAllProducts } from "@/lib/products";
import { FEATURE_LABELS } from "@/lib/features";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

type CategoryFilter = "all" | ProductCategory;
type SortMode = "default" | "price-asc" | "price-desc";

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "personal", label: "Personal" },
  { value: "expert", label: "Expert help" },
  { value: "corporate", label: "Corporate" },
];

export default function ProductsPage() {
  const all = getAllProducts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortMode>("default");

  const filtered = useMemo(() => {
    let list = all.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const haystack = [
        p.name,
        p.tagline,
        p.description,
        ...p.bestFor,
        ...p.highlights,
        ...ALL_FEATURE_KEYS.filter((k) => p.supports[k]).map((k) => FEATURE_LABELS[k]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [all, query, category, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Products</h1>
        <p className="mt-2 text-muted-foreground">
          Every TaxFit plan, with pricing in CAD. Filter by type, sort by price, or search by a
          feature like “rental income” or “expert review”.
        </p>
      </header>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                category === c.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by feature…"
              aria-label="Search products by feature"
              className="h-11 w-full rounded-full border border-input bg-card pl-9 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
            />
          </div>
          <label className="sr-only" htmlFor="sort">
            Sort products
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="h-11 rounded-full border border-input bg-card px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="default">Recommended order</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "product" : "products"}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">No products match “{query}”.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different feature, or clear the search to see everything.
          </p>
        </div>
      )}
    </div>
  );
}
