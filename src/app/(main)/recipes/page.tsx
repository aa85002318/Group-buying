import type { Metadata } from "next";
import { RecipesClient } from "@/components/recipes/RecipesClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY 食譜影音｜烘焙食譜與教學影片",
  description: "最新食譜、一分鐘教學、熱門影音與烘焙知識。",
};

export default function RecipesPage() {
  return <RecipesClient />;
}
