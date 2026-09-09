import type { Metadata } from "next";
import { ThemesPageClient } from "./ThemesPageClient";

export const metadata: Metadata = {
  title: "季節主題企劃｜CHIMEIDIY",
  description: "探索季節烘焙主題與精選企劃。",
};

export default function ThemesPage() {
  return <ThemesPageClient />;
}
