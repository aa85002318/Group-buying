import type { Metadata } from "next";
import { ActivitiesPageClient } from "./ActivitiesPageClient";

export const metadata: Metadata = {
  title: "最新活動｜CHIMEIDIY",
  description: "會員活動、門市優惠與限時專案",
};

export default function ActivitiesPage() {
  return <ActivitiesPageClient />;
}
