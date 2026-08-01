import type { Metadata } from "next";
import { ShopNewArrivalsPageClient } from "./ShopNewArrivalsPageClient";

export const metadata: Metadata = {
  title: "新品上架｜商城",
  description: "CHIMEIDIY 商城新品上架精選。",
};

export default function ShopNewArrivalsPage() {
  return <ShopNewArrivalsPageClient />;
}
