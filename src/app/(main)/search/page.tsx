import { Suspense } from "react";
import { SearchPageClient } from "./SearchPageClient";

export const metadata = {
  title: "搜尋｜CHIMEIDIY",
  description: "搜尋商品、食譜、團購、最新資訊、FAQ 與門市商品位置。",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-foreground-secondary">載入搜尋…</p>}>
      <SearchPageClient />
    </Suspense>
  );
}
