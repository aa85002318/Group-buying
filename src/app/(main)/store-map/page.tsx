import type { Metadata } from "next";
import { StoreMapClient } from "./StoreMapClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY 門市商品地圖",
  description: "以文字查詢商品區域、貨架與層架位置（非即時室內導航）。",
};

export default function StoreMapPage() {
  return <StoreMapClient />;
}
