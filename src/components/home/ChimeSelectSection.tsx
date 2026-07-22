"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeProductRailCard } from "@/components/home/HomeProductRailCard";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { Chip } from "@/components/ui/chip";
import type { Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export type ChimeCategoryChip = {
  id: string;
  label: string;
  href?: string | null;
  categorySlug?: string | null;
};

const DEFAULT_CHIME_CATEGORIES: ChimeCategoryChip[] = [
  { id: "all", label: "全部", categorySlug: null },
  { id: "home", label: "居家", categorySlug: "home" },
  { id: "kitchen", label: "廚房", categorySlug: "kitchen" },
  { id: "gift", label: "送禮", categorySlug: "gift" },
  { id: "seasonal", label: "季節", categorySlug: "seasonal" },
  { id: "new", label: "新品", categorySlug: "new" },
];

function parseCategories(raw: unknown): ChimeCategoryChip[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_CHIME_CATEGORIES;
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? row.name ?? "").trim();
      if (!label) return null;
      return {
        id: String(row.id ?? `cat-${index}`),
        label,
        href: row.href ? String(row.href) : null,
        categorySlug: row.categorySlug
          ? String(row.categorySlug)
          : row.category_slug
            ? String(row.category_slug)
            : row.slug
              ? String(row.slug)
              : null,
      };
    })
    .filter(Boolean) as ChimeCategoryChip[];
}

type ChimeSelectSectionProps = {
  title?: string;
  subtitle?: string | null;
  viewAllHref?: string;
  config?: Record<string, unknown> | null;
  manualIds?: string[];
  limit?: number;
  className?: string;
};

export function ChimeSelectSection({
  title = "CHIME 精選",
  subtitle,
  viewAllHref = "/shop?scope=chime_select",
  config,
  manualIds,
  limit = 8,
  className,
}: ChimeSelectSectionProps) {
  const categories = useMemo(() => parseCategories(config?.categories), [config]);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/products?scope=chime_select")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        let list = (d.products ?? []) as Product[];
        if (manualIds?.length) {
          const order = new Map(manualIds.map((id, i) => [id, i]));
          list = list
            .filter((p) => order.has(p.id))
            .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        }
        setProducts(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualIds?.join(",")]);

  const active = categories.find((c) => c.id === activeCategory) ?? categories[0];
  const filtered = useMemo(() => {
    const slug = active?.categorySlug;
    if (!slug || active?.id === "all") return products;
    return products.filter(
      (p) =>
        p.product_categories?.slug === slug ||
        (p.subtitle ?? "").toLowerCase().includes(slug.toLowerCase())
    );
  }, [products, active]);

  const visible = filtered.slice(0, limit);

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <SectionHeader title={title} href={viewAllHref} accentClass="bg-info" />
      {subtitle ? (
        <p className="-mt-2 text-sm text-foreground-secondary">{subtitle}</p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            active={cat.id === activeCategory}
            tone="gray"
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </Chip>
        ))}
      </div>

      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={load}
        empty={!loading && !error && visible.length === 0}
        emptyTitle="尚無 CHIME 精選商品"
        emptyActionHref={viewAllHref}
        emptyActionLabel="前往選購"
        skeletonCount={4}
      >
        <HorizontalScroller className="md:grid md:grid-cols-3 md:gap-4 md:overflow-visible lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((p) => (
            <HomeProductRailCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={Number(p.sale_price ?? p.price)}
              originalPrice={p.original_price}
              imageUrl={p.image_url}
              spec={p.unit ?? p.subtitle ?? null}
            />
          ))}
        </HorizontalScroller>
      </HomeSectionFrame>
    </section>
  );
}
