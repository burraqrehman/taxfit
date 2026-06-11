import { Badge } from "@/components/ui/badge";
import type { ProductCategory } from "@/lib/types";

const LABELS: Record<ProductCategory, string> = {
  personal: "Personal",
  expert: "Expert help",
  corporate: "Corporate",
};

const VARIANTS = {
  personal: "primary",
  expert: "accent",
  corporate: "muted",
} as const;

export function CategoryBadge({ category }: { category: ProductCategory }) {
  return <Badge variant={VARIANTS[category]}>{LABELS[category]}</Badge>;
}
