"use client";

import { useEffect, useState } from "react";
import { Sparkles, UtensilsCrossed } from "lucide-react";
import type { HomepageBlock } from "@/lib/types/database";
import type { Product, ProductCategory } from "@/lib/types/database";
import { mockProducts } from "@/lib/mock-data";
import {
  buildCategoryTabs,
  pickIngredientShopProducts,
  resolveIngredientShopSection,
} from "@/lib/home/ingredient-shop";
import { ProductCategoryTabs } from "./ingredient-shop/ProductCategoryTabs";
import { IngredientShopProductCard } from "./ingredient-shop/IngredientShopProductCard";
import { MoreProductsCard } from "./ingredient-shop/MoreProductsCard";
import { ProductHorizontalScroller } from "./ingredient-shop/ProductHorizontalScroller";

export function HomeIngredientShopSection() {
  const [cmsSection, setCmsSection] = useState(() => resolveIngredientShopSection(null));
  const [visible, setVisible] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cmsRes, productsRes, categoriesRes] = await Promise.all([
          fetch("/api/cms", { credentials: "include" }),
          fetch("/api/products?scope=baking"),
          fetch("/api/categories"),
        ]);
        const cmsJson = await cmsRes.json().catch(() => ({}));
        const productsJson = await productsRes.json().catch(() => ({}));
        const categoriesJson = await categoriesRes.json().catch(() => ({}));
        if (cancelled) return;

        const blocks = (cmsJson.blocks ?? []) as HomepageBlock[];
        const resolved = resolveIngredientShopSection(blocks);
        const row = blocks.find((b) => b.block_key === "ingredient_shop");
        setVisible(row ? row.is_visible !== false : true);
        setCmsSection(resolved);

        const list = productsJson.products?.length
          ? (productsJson.products as Product[])
          : mockProducts;
        setProducts(list);
        setCategories((categoriesJson.categories ?? []) as ProductCategory[]);
      } catch {
        if (!cancelled) {
          setProducts(mockProducts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible || cmsSection.config.enabled === false) return null;

  const tabs = buildCategoryTabs(categories, cmsSection.config);
  const visibleProducts = pickIngredientShopProducts({
    products,
    config: cmsSection.config,
    manualIds: cmsSection.manualIds,
    categoryId: activeCategoryId,
    limit: cmsSection.displayCount,
  });

  const moreHref =
    cmsSection.config.more_card_link ||
    cmsSection.viewAllUrl ||
    "/baking-materials";

  return (
    <section
      className="ingredient-shop-section bg-[#FFFEFA] py-10 md:py-16"
      aria-label={cmsSection.title}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">
        <header className="mb-6">
          <div className="flex items-start gap-2">
            <span className="mt-1 inline-flex items-center gap-1 text-[#FFD454]" aria-hidden>
              <Sparkles className="h-5 w-5 fill-[#FFD454] text-[#FFD454]" />
              <UtensilsCrossed className="h-4 w-4 text-[#153E73]" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-[#153E73] md:text-[32px]">
                {cmsSection.title}
              </h2>
              <p className="mt-1 text-sm text-[#687386] md:text-base">{cmsSection.subtitle}</p>
            </div>
          </div>
        </header>

        <div className="mb-6">
          <ProductCategoryTabs
            tabs={tabs}
            activeId={activeCategoryId}
            onChange={setActiveCategoryId}
            moreOptionsHref={moreHref}
          />
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="home-skeleton h-[420px] w-[78vw] max-w-[280px] shrink-0 rounded-[20px] md:w-[270px]"
              />
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <p className="rounded-2xl border border-[#E9EDF2] bg-white px-4 py-8 text-center text-sm text-[#687386]">
            此分類暫無商品，試試其他分類或前往完整商品頁。
          </p>
        ) : (
          <ProductHorizontalScroller>
            {visibleProducts.map((product) => (
              <IngredientShopProductCard key={product.id} product={product} />
            ))}
            <MoreProductsCard
              title={cmsSection.config.more_card_title}
              subtitle={cmsSection.config.more_card_subtitle}
              href={moreHref}
            />
          </ProductHorizontalScroller>
        )}
      </div>
    </section>
  );
}
