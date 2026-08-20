import type { Metadata } from "next";
import { ShopSalePageClient } from "./ShopSalePageClient";

export const metadata: Metadata = {
  title: "優惠商品｜商城",
  description: "CHIMEIDIY 商城優惠商品精選。",
};

export default function ShopSalePage() {
  return <ShopSalePageClient />;
}
