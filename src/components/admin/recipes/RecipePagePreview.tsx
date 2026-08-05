"use client";

import { StoryPageView } from "@/components/recipes/storybook/StoryPageView";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import { DEFAULT_READER_SETTINGS } from "@/lib/recipes/reader-settings";
import type {
  Recipe,
  RecipeStoryChapter,
  RecipeStoryPage,
  RecipeStoryPageMedia,
} from "@/lib/types/database";

type PreviewPage = RecipeStoryPage & {
  recipe_story_page_media: RecipeStoryPageMedia[];
  chapter?: RecipeStoryChapter | null;
};

type Props = {
  page: PreviewPage;
  /** Recipe title shown in cover/chapter contexts (falls back to 「預覽」). */
  recipeTitle?: string | null;
  /** Recipe cover image, used when a page has no media of its own. */
  coverImage?: string | null;
  /** Fill parent frame (matches storybook reader's `bookFit` layout). */
  bookFit?: boolean;
};

const NOW_ISO = "1970-01-01T00:00:00.000Z";

function buildPreviewRecipe(title?: string | null, coverImage?: string | null): Recipe {
  return {
    id: "preview",
    title: title?.trim() || "預覽",
    slug: "preview",
    summary: null,
    cover_image: coverImage ?? null,
    category_id: null,
    difficulty: "easy",
    prep_time: null,
    cook_time: null,
    total_time: null,
    servings: null,
    content: null,
    tips: null,
    storage_method: null,
    status: "draft",
    published_at: null,
    seo_title: null,
    seo_description: null,
    related_video_id: null,
    sort_order: 0,
    is_featured: false,
    created_by: null,
    updated_by: null,
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
    recipe_steps: [],
    recipe_ingredients: [],
  };
}

function buildPreviewPayload(recipe: Recipe): SmartRecipePayload {
  return {
    recipe,
    tools: [],
    preparations: [],
    media: [],
    faq: [],
    recommendations: [],
    related: [],
    discussionCount: 0,
    submissionCount: 0,
  };
}

/**
 * Thin admin-preview wrapper around `StoryPageView`. Renders a single story
 * page exactly as readers would see it, minus live/interactive panels
 * (discussion, submissions, AI, cover CTAs) which don't make sense while
 * editing in the admin flipbook builder.
 */
export function RecipePagePreview({ page, recipeTitle, coverImage, bookFit = true }: Props) {
  const recipe = buildPreviewRecipe(recipeTitle, coverImage);
  const data = buildPreviewPayload(recipe);

  return (
    <StoryPageView
      page={page}
      pageActive
      data={data}
      previewMode
      interactive={false}
      bookFit={bookFit}
      multiplier={1}
      onMultiplierChange={() => {}}
      haveIds={new Set()}
      onToggleHave={() => {}}
      muted
      guided={false}
      completedPageIds={new Set()}
      onMarkComplete={() => {}}
      comparisonChoice={null}
      onComparisonChoice={() => {}}
      checkpointChecked={new Set()}
      onCheckpointToggle={() => {}}
      timerRemaining={0}
      timerRunning={false}
      timerInitial={0}
      onTimerToggle={() => {}}
      onTimerReset={() => {}}
      onAskAi={() => {}}
      onPlaybackContext={() => {}}
      hideScaling
      readerSettings={{ ...DEFAULT_READER_SETTINGS, showAskTeacher: false }}
    />
  );
}
