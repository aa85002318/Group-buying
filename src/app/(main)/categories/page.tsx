import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoriesPageClient } from "@/components/categories/CategoriesPageClient";
import { BRAND_NAME } from "@/lib/env";

export const metadata: Metadata = {
  title: `商品分類｜${BRAND_NAME}`,
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#FFFEFA]" />}>
      <CategoriesPageClient />
    </Suspense>
  );
}
