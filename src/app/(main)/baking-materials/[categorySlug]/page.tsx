import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategoryBySlug } from "@/lib/baking-materials/queries";
import { BakingMaterialsClient } from "../BakingMaterialsClient";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return { title: "烘焙材料" };
  }

  return {
    title: `${category.name}｜烘焙材料`,
    description: `瀏覽${category.name}相關烘焙材料，依品牌與價格篩選。`,
  };
}

function CatalogFallback() {
  return (
    <div className="baking-catalog-page mx-auto max-w-[1280px] px-4 py-8">
      <p className="text-sm text-[#8C644A]">載入分類商品…</p>
    </div>
  );
}

export default async function BakingMaterialsCategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  return (
    <Suspense fallback={<CatalogFallback />}>
      <BakingMaterialsClient categorySlug={categorySlug} />
    </Suspense>
  );
}
