import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type SectionProps = {
  title: string;
  href?: string;
  products: Product[];
  limitMobile?: number;
  limitTablet?: number;
  badge?: "new" | "hot";
  className?: string;
};

function ProductGridSection({
  title,
  href,
  products,
  limitMobile = 4,
  limitTablet = 8,
  badge,
  className,
}: SectionProps) {
  const mobile = products.slice(0, limitMobile);
  const tabletExtra = products.slice(limitMobile, limitTablet);

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {href && (
          <Link
            href={href}
            className="inline-flex min-h-touch items-center gap-0.5 text-sm font-semibold text-primary"
          >
            查看全部
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
        {mobile.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={Number(p.price)}
            original_price={p.original_price}
            image_url={p.image_url}
            badge={badge}
          />
        ))}
        {tabletExtra.map((p) => (
          <div key={p.id} className="hidden md:block">
            <ProductCard
              id={p.id}
              name={p.name}
              price={Number(p.price)}
              original_price={p.original_price}
              image_url={p.image_url}
              badge={badge}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function NewProductsSection(props: Omit<SectionProps, "title" | "badge"> & { title?: string }) {
  return <ProductGridSection title={props.title ?? "新品上架"} badge="new" {...props} />;
}

export function PopularProductsSection(
  props: Omit<SectionProps, "title" | "badge"> & { title?: string }
) {
  return <ProductGridSection title={props.title ?? "熱門商品"} badge="hot" {...props} />;
}
