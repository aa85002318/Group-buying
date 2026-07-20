import type { Metadata } from "next";
import { RecipeDetailClient } from "@/components/recipes/RecipeDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "食譜｜CHIMEIDIY",
    description: `查看食譜 ${slug} — CHIMEIDIY 烘焙食譜與教學`,
  };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params;
  return <RecipeDetailClient slug={slug} />;
}
