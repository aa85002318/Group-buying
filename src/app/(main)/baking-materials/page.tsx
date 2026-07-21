import type { Metadata } from "next";
import { Suspense } from "react";
import { BakingMaterialsClient } from "./BakingMaterialsClient";

export const metadata: Metadata = {
  title: "烘焙材料",
  description: "原料、器具、包裝一次購足。依分類、品牌與價格篩選烘焙材料。",
};

function CatalogFallback() {
  return (
    <div className="baking-catalog-page mx-auto max-w-[1280px] px-4 py-8">
      <p className="text-sm text-[#8C644A]">載入烘焙材料…</p>
    </div>
  );
}

export default function BakingMaterialsPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <BakingMaterialsClient />
    </Suspense>
  );
}
