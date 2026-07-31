import type { Metadata } from "next";
import { ShopHubClient } from "./ShopHubClient";

export const metadata: Metadata = {
  title: "烘焙好物商城｜CHIMEIDIY",
  description: "精選烘焙材料、器具與包裝。滿版活動 Banner 與智慧搜尋，一次購足。",
};

export default function ShopPage() {
  return <ShopHubClient />;
}
