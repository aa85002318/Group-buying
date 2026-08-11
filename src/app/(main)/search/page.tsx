import { Suspense } from "react";
import { SearchPageClient } from "./SearchPageClient";

export const metadata = {
  title: "搜尋｜CHIMEIDIY",
  description: "搜尋商品、食譜、烘焙知識。",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-foreground-secondary">載入搜尋…</p>}>
      <SearchPageClient />
    </Suspense>
  );
}
