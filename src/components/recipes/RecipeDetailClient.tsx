"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RecipeStorybookReader } from "@/components/recipes/storybook/RecipeStorybookReader";
import { StoryFullRecipeView } from "@/components/recipes/storybook/StoryFullRecipeView";
import {
  ArticleRecipeTemplate,
  VideoRecipeTemplate,
} from "@/components/recipes/simple/RecipeTemplates";
import { recordBrowse } from "@/lib/home/browse-history";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import { parseReaderSettings } from "@/lib/recipes/reader-settings";
import { resolveRecipeType } from "@/lib/recipes/recipe-type";
import {
  flattenStoryPages,
  hasActiveStorybook,
  type StorybookPayload,
} from "@/lib/recipes/storybook";
import type { Recipe, RecipeProductRecommendation } from "@/lib/types/database";

type Props = {
  slug: string;
  /** Kindle-like: no site chrome (immersive route group). */
  immersive?: boolean;
};

export function RecipeDetailClient({ slug, immersive = false }: Props) {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const [payload, setPayload] = useState<SmartRecipePayload | null>(null);
  const [stories, setStories] = useState<StorybookPayload | null>(null);
  const [recommendations, setRecommendations] = useState<RecipeProductRecommendation[]>([]);
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
        setRecommendations(d.recommendations ?? []);

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
      <div
        className={
          immersive
            ? "flex min-h-[100dvh] items-center justify-center bg-[#FFFEFA]"
            : "space-y-4 bg-[#FFFEFA] p-5"
        }
      >
        <div className="aspect-[16/9] w-full max-w-3xl animate-pulse rounded-2xl bg-[#FFF5CC]" />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="space-y-3 bg-[#FFFEFA] py-10 text-center text-[#153E73]">
        <p className="text-[#8A94A6]">{error ?? "找不到食譜"}</p>
        <Link href="/recipes" className="text-sm text-[#F16458] hover:underline">
          返回食譜列表
        </Link>
      </div>
    );
  }

  const hasStories = stories && hasActiveStorybook(stories.chapters);
  const explicitType =
    payload.recipe.recipe_type === "video" || payload.recipe.recipe_type === "article"
      ? payload.recipe.recipe_type
      : null;

  // New simplified templates when recipe_type is set, or when there is no storybook tree.
  if (explicitType || !hasStories) {
    const mode = resolveRecipeType(payload.recipe);
    if (mode === "video") {
      return <VideoRecipeTemplate data={payload} recommendations={recommendations} />;
    }
    return <ArticleRecipeTemplate data={payload} recommendations={recommendations} />;
  }

  // Legacy Story Book path (unchanged for recipes that still rely on chapters)
  const settings = parseReaderSettings(payload.recipe.reader_settings);
  const fullEnabled = payload.recipe.full_reading_enabled !== false;
  const flipEnabled = payload.recipe.flip_mode_enabled !== false;

  let view: "full" | "flip" | "scroll" =
    viewParam === "scroll"
      ? "scroll"
      : viewParam === "full"
        ? "full"
        : viewParam === "flip"
          ? "flip"
          : "full";
  if (viewParam !== "full" && viewParam !== "flip" && viewParam !== "scroll") {
    if (settings.listPrimaryFull === false && flipEnabled) view = "flip";
    else if (
      payload.recipe.reading_mode_default === "flip" &&
      flipEnabled &&
      !settings.listPrimaryFull
    ) {
      view = "flip";
    } else {
      view = fullEnabled ? "full" : "flip";
    }
  }
  if ((view === "full" || view === "scroll") && !fullEnabled && flipEnabled) view = "flip";
  if (view === "flip" && !flipEnabled && fullEnabled) view = "full";

  if (view === "scroll") {
    return <StoryFullRecipeView data={payload} stories={stories!} />;
  }
  return <RecipeStorybookReader data={payload} stories={stories!} immersive />;
}
