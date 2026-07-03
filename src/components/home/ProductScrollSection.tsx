import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import type { HomeProduct } from "@/lib/home";
import { formatCutoffLabel } from "@/lib/home";

interface ProductScrollSectionProps {
  title: string;
  products: HomeProduct[];
  seeMoreHref?: string;
  showCutoff?: boolean;
  emptyText?: string;
  fourPerRow?: boolean;
}

const CARD_WIDTH = "calc((100% - 0.75rem * 3) / 4)";

export function ProductScrollSection({
  title,
  products,
  seeMoreHref,
  showCutoff,
  emptyText = "暫無商品",
  fourPerRow = false,
}: ProductScrollSectionProps) {
  return (
    <section className="rounded-xl bg-background py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-coffee">{title}</h2>
        {seeMoreHref && (
          <Link href={seeMoreHref} className="text-sm text-primary">
            查看更多
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div
          className={
            fourPerRow
              ? "flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "-mx-4 flex gap-3 overflow-x-auto px-4 pb-1"
          }
        >
          {products.map((p) => (
            <div
              key={`${p.id}-${p.cutoff_at ?? ""}`}
              className="relative shrink-0 snap-start"
              style={fourPerRow ? { width: CARD_WIDTH, minWidth: CARD_WIDTH } : { width: "9rem" }}
            >
              {showCutoff && p.cutoff_at && (
                <Badge variant="countdown" className="absolute left-2 top-2 z-10">
                  {formatCutoffLabel(p.cutoff_at)}
                </Badge>
              )}
              <ProductCard
                id={p.id}
                name={p.name}
                price={p.price}
                original_price={p.original_price}
                image_url={p.image_url}
                href={p.href}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
