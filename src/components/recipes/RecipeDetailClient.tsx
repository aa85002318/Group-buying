"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SmartRecipeReader } from "@/components/recipes/SmartRecipeReader";
import { RecipeStorybookReader } from "@/components/recipes/storybook/RecipeStorybookReader";
import { StoryFullRecipeView } from "@/components/recipes/storybook/StoryFullRecipeView";
import { recordBrowse } from "@/lib/home/browse-history";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import {
  parseReaderSettings,
} from "@/lib/recipes/reader-settings";
import {
  flattenStoryPages,
  hasActiveStorybook,
  type StorybookPayload,
} from "@/lib/recipes/storybook";
import type { Recipe } from "@/lib/types/database";

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
      <div
        className={
          immersive
            ? "flex min-h-[100dvh] items-center justify-center bg-[#1a100c]"
            : "space-y-4"
        }
      >
        <div
          className={
            immersive
              ? "h-10 w-10 animate-pulse rounded-full bg-white/20"
              : "aspect-[16/9] animate-pulse rounded-[22px] bg-muted"
          }
        />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="space-y-3 py-10 text-center text-white">
        <p className="text-white/70">{error ?? "找不到食譜"}</p>
        <Link href="/recipes" className="text-sm text-[#FF5A5F] hover:underline">
          返回食譜列表
        </Link>
      </div>
    );
  }

  const hasStories = stories && hasActiveStorybook(stories.chapters);
  const settings = parseReaderSettings(payload.recipe.reader_settings);
  const fullEnabled = payload.recipe.full_reading_enabled !== false;
  const flipEnabled = payload.recipe.flip_mode_enabled !== false;

  // Resolve view: query > reader_settings.listPrimaryFull > recipe default
  let view: "full" | "flip" =
    viewParam === "full" ? "full" : viewParam === "flip" ? "flip" : "full";
  if (viewParam !== "full" && viewParam !== "flip") {
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
  if (view === "full" && !fullEnabled && flipEnabled) view = "flip";
  if (view === "flip" && !flipEnabled && fullEnabled) view = "full";

  if (hasStories) {
    if (view === "full") {
      return <StoryFullRecipeView data={payload} stories={stories!} />;
    }
    return (
      <RecipeStorybookReader data={payload} stories={stories!} immersive={immersive} />
    );
  }

  return (
    <SmartRecipeReader
      data={payload}
      immersive={immersive}
      initialMode={view}
    />
  );
}
