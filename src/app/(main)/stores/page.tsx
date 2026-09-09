import type { Metadata } from "next";
import { StoresPageClient } from "./StoresPageClient";

export const metadata: Metadata = {
  title: "門市資訊｜CHIMEIDIY",
  description: "鄰近門市、營業時間與取貨服務",
};

export default function StoresPage() {
  return <StoresPageClient />;
}
