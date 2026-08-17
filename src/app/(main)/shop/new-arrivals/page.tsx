import type { Metadata } from "next";
import { ShopNewArrivalsPageClient } from "./ShopNewArrivalsPageClient";

export const metadata: Metadata = {
  title: "本週上新｜商城",
  description: "CHIMEIDIY 商城本週上新精選。",
};

export default function ShopNewArrivalsPage() {
  return <ShopNewArrivalsPageClient />;
}
