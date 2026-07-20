import type { Metadata } from "next";
import { ShopHubClient } from "./ShopHubClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY 烘焙材料｜烘焙原料、器具與包裝",
  description: "原料、器具、包裝一次購足。瀏覽分類、今日新品與人氣商品。",
};

export default function ShopPage() {
  return <ShopHubClient />;
}
