import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getBakingMaterialCategories,
  getBrandsForCatalog,
  getCategoryTree,
  parseBakingFiltersFromSearchParams,
  searchBakingProducts,
} from "@/lib/baking-materials/queries";
import { BakingMaterialsClient } from "./BakingMaterialsClient";

export const metadata: Metadata = {
  title: "烘焙好物商城",
  description: "精選超過 4,000 項商品。原料、器具、包裝一次購足。依分類、品牌與價格篩選烘焙材料。",
};

function CatalogFallback() {
  return (
    <div className="baking-catalog-page mx-auto max-w-[1280px] px-4 py-8">
      <p className="text-sm text-[#8C644A]">載入烘焙材料…</p>
    </div>
  );
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BakingMaterialsPage({ searchParams }: PageProps) {
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
  const [categories, brands, initialProducts] = await Promise.all([
    getBakingMaterialCategories(),
    getBrandsForCatalog(),
    searchBakingProducts(filters),
  ]);

  return (
    <Suspense fallback={<CatalogFallback />}>
      <BakingMaterialsClient
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
