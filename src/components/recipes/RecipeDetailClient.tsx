"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SmartRecipeReader } from "@/components/recipes/SmartRecipeReader";
import { RecipeStorybookReader } from "@/components/recipes/storybook/RecipeStorybookReader";
import { recordBrowse } from "@/lib/home/browse-history";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import {
  flattenStoryPages,
  hasActiveStorybook,
  type StorybookPayload,
} from "@/lib/recipes/storybook";
import type { Recipe } from "@/lib/types/database";

export function RecipeDetailClient({ slug }: { slug: string }) {
  const [payload, setPayload] = useState<SmartRecipePayload | null>(null);
  const [stories, setStories] = useState<StorybookPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(
      `/api/recipes/${encodeURIComponent(slug)}?include=tools,preparations,media,faq,recommendations,summaries,stories`
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        const recipe = d.recipe as Recipe;
        setPayload({
          recipe,
          tools: d.tools ?? [],
          preparations: d.preparations ?? [],
          media: d.media ?? [],
          faq: d.faq ?? [],
          recommendations: d.recommendations ?? [],
          related: d.related_recipes ?? [],
          discussionCount: d.discussionSummary?.count ?? 0,
          submissionCount: d.submissionSummary?.count ?? 0,
        });

        const chapters = d.stories?.chapters ?? d.chapters ?? [];
        if (Array.isArray(chapters) && chapters.length) {
          setStories({
            chapters,
            flatPages: flattenStoryPages(chapters),
          });
        } else {
          setStories(null);
        }

        if (recipe) {
          recordBrowse({
            type: "recipe",
            id: recipe.id,
            title: recipe.title,
            imageUrl: recipe.cover_image,
            href: `/recipes/${recipe.slug || recipe.id}`,
          });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-[16/9] animate-pulse rounded-[22px] bg-muted" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-[18px] bg-muted" />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-foreground-secondary">{error ?? "找不到食譜"}</p>
        <Link href="/recipes" className="text-sm text-primary hover:underline">
          返回食譜列表
        </Link>
      </div>
    );
  }

  if (stories && hasActiveStorybook(stories.chapters)) {
    return <RecipeStorybookReader data={payload} stories={stories} />;
  }

  return <SmartRecipeReader data={payload} />;
}
