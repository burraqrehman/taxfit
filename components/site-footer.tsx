import Link from "next/link";
import { Logo } from "@/components/logo";
import { SHORT_DISCLAIMER } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              Find the tax software that fits your situation — in a few quick questions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterCol
              title="Product"
              links={[
                { href: "/products", label: "All products" },
                { href: "/compare", label: "Compare" },
                { href: "/recommend", label: "Find my product" },
              ]}
            />
            <FooterCol
              title="Help"
              links={[
                { href: "/assistant", label: "AI assistant" },
                { href: "/admin/products", label: "Admin config" },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">{SHORT_DISCLAIMER}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} TaxFit — a fictional product built for a web + AI assignment.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
