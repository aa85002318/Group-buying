import type { Metadata } from "next";
import { RecipeDetailClient } from "@/components/recipes/RecipeDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "食譜教材｜CHIMEIDIY",
    description: `CHIMEIDIY 翻頁教材 ${slug}`,
  };
}

/** Immersive Story Book — no site header/footer (Kindle-like). */
export default async function RecipeStoryBookPage({ params }: Props) {
  const { slug } = await params;
  return <RecipeDetailClient slug={slug} immersive />;
}
