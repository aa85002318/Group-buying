import type { Metadata } from "next";
import { ShopPopularPageClient } from "./ShopPopularPageClient";

export const metadata: Metadata = {
  title: "熱門商品｜商城",
  description: "CHIMEIDIY 商城熱門商品精選。",
};

export default function ShopPopularPage() {
  return <ShopPopularPageClient />;
}
