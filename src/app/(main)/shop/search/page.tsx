import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "@/app/(main)/search/SearchPageClient";

export const metadata: Metadata = {
  title: "搜尋商品｜CHIMEIDIY",
  description: "搜尋商品、食譜、烘焙知識。",
};

export default function ShopSearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-foreground-secondary">載入搜尋…</p>}>
      <SearchPageClient />
    </Suspense>
  );
}
