import { Suspense } from "react";
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
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#1a100c]">
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/20" />
        </div>
      }
    >
      <RecipeDetailClient slug={slug} immersive />
    </Suspense>
  );
}
