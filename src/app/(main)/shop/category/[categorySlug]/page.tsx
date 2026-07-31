import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getBakingMaterialCategories,
  getBrandsForCatalog,
  getCategoryBySlug,
  getCategoryTree,
  parseBakingFiltersFromSearchParams,
  searchBakingProducts,
} from "@/lib/baking-materials/queries";
import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return { title: "商品分類｜商城" };
  }

  return {
    title: `${category.name}｜商城`,
    description: `瀏覽${category.name}相關商品，依品牌與價格篩選。`,
  };
}

function CatalogFallback() {
  return (
    <div className="baking-catalog-page mx-auto max-w-[1280px] px-4 py-8">
      <p className="text-sm text-[#8C644A]">載入分類商品…</p>
    </div>
  );
}

export default async function ShopCategoryPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const rawSearchParams = await searchParams;
  const normalizedSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) normalizedSearchParams.append(key, item);
    } else if (typeof value === "string") {
      normalizedSearchParams.set(key, value);
    }
  }

  const filters = parseBakingFiltersFromSearchParams(normalizedSearchParams);
  filters.categorySlug = categorySlug;

  const [categories, brands, initialProducts] = await Promise.all([
    getBakingMaterialCategories(),
    getBrandsForCatalog(),
    searchBakingProducts(filters),
  ]);

  return (
    <Suspense fallback={<CatalogFallback />}>
      <ShopCatalogClient
        categorySlug={categorySlug}
        initialMeta={{
          categories,
          tree: getCategoryTree(categories),
          brands,
        }}
        initialProducts={initialProducts}
        initialQueryString={normalizedSearchParams.toString()}
      />
    </Suspense>
  );
}
