"use client";

import { useEffect, useState } from "react";
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
    "/shop/categories";

  return (
    <section
      className="ingredient-shop-section mt-[15px] bg-white pb-7 pt-0 md:pb-10"
      aria-label={cmsSection.title}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 xl:max-w-[1320px]">
        <header className="mb-3.5 md:mb-[18px]">
          <div className="flex items-start gap-2">
            <span
              className="mt-[5px] h-7 w-1.5 shrink-0 rounded-full bg-[#FFD454]"
              aria-hidden
            />
            <div className="min-w-0">
              <h2 className="text-[22px] font-bold leading-[1.25] text-[#153E73] md:text-[28px]">
                {cmsSection.title}
              </h2>
              <p className="mt-1.5 line-clamp-1 text-[13px] text-[#687386] md:text-sm">
                {cmsSection.subtitle}
              </p>
            </div>
          </div>
        </header>

        <div className="mb-3.5 md:mb-[18px]">
          <ProductCategoryTabs
            tabs={tabs}
            activeId={activeCategoryId}
            onChange={setActiveCategoryId}
            moreOptionsHref={moreHref}
          />
        </div>

        {loading ? (
          <div className="flex gap-2.5 overflow-hidden pb-2 md:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="home-skeleton h-[300px] w-[calc((100vw-48px)/2.15)] min-w-[156px] max-w-[176px] shrink-0 rounded-2xl md:h-[340px] md:w-[210px] md:min-w-[210px] md:max-w-[210px] xl:w-[220px] xl:min-w-[220px] xl:max-w-[220px]"
              />
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <p className="rounded-2xl border border-[#E9EDF2] bg-white px-4 py-6 text-center text-sm text-[#687386]">
            此分類暫無商品，試試其他分類或前往完整商品頁。
          </p>
        ) : (
          <ProductHorizontalScroller>
            {visibleProducts.map((product) => (
              <IngredientShopProductCard key={product.id} product={product} />
            ))}
            <MoreProductsCard
              title={cmsSection.config.more_card_title}
              subtitle={cmsSection.config.more_card_subtitle || "查看全部"}
              href={moreHref}
            />
          </ProductHorizontalScroller>
        )}
      </div>
    </section>
  );
}
