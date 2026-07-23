import type {
  RecipeMedia,
  RecipeStoryPage,
  RecipeStoryPageMedia,
} from "@/lib/types/database";
import type {
  StoryCompletionConfig,
  StoryContentConfig,
} from "@/lib/recipes/story-types";

export function parseContentConfig(
  page: RecipeStoryPage | null | undefined
): StoryContentConfig {
  const raw = (page?.content_config ?? {}) as StoryContentConfig;
  return raw && typeof raw === "object" ? raw : {};
}

export function parseCompletionConfig(
  page: RecipeStoryPage | null | undefined
): StoryCompletionConfig {
  const raw = (page?.completion_config ?? {}) as StoryCompletionConfig;
  return raw && typeof raw === "object" ? raw : {};
}

export function pageMediaToRecipeMedia(
  m: RecipeStoryPageMedia,
  recipeId: string
): RecipeMedia {
  return {
    id: m.id,
    recipe_id: recipeId,
    step_id: null,
    story_page_id: m.story_page_id,
    media_type: m.media_type,
    source_type: m.source_type,
    url: m.url,
    thumbnail_url: m.thumbnail_url,
    subtitle_url: m.subtitle_url,
    aspect_ratio: null,
    duration_seconds: m.duration_seconds,
    start_seconds: m.start_seconds ?? null,
    end_seconds: m.end_seconds ?? null,
    storage_bucket: m.storage_bucket ?? null,
    storage_path: m.storage_path ?? null,
    original_filename: m.original_filename ?? null,
    mime_type: m.mime_type ?? null,
    file_size_bytes: m.file_size_bytes ?? null,
    upload_status: m.upload_status,
    processing_status: m.processing_status,
    autoplay: false,
    muted: true,
    loop: false,
    allow_slow_playback: true,
    alt_text: m.alt_text ?? m.caption,
    sort_order: m.sort_order,
    is_active: m.active !== false && m.processing_status !== "migration_required",
    created_at: m.created_at,
    updated_at: m.updated_at,
    recipe_video_markers: [],
  };
}

export function primaryMedia(
  media: RecipeStoryPageMedia[] | undefined
): RecipeStoryPageMedia | null {
  if (!media?.length) return null;
  return media[0] ?? null;
}

export function clipBounds(
  media: RecipeStoryPageMedia | null | undefined,
  config: StoryContentConfig
): { startSeconds?: number; endSeconds?: number } {
  const meta = (media?.metadata ?? {}) as Record<string, unknown>;
  const start =
    typeof config.startSeconds === "number"
      ? config.startSeconds
      : media?.start_seconds != null
        ? Number(media.start_seconds)
        : typeof meta.start_seconds === "number"
          ? meta.start_seconds
          : undefined;
  const end =
    typeof config.endSeconds === "number"
      ? config.endSeconds
      : media?.end_seconds != null
        ? Number(media.end_seconds)
        : typeof meta.end_seconds === "number"
          ? meta.end_seconds
          : undefined;
  return { startSeconds: start, endSeconds: end };
}

export function isGuidedGatePage(
  page: RecipeStoryPage,
  config: StoryContentConfig
): boolean {
  if (config.skipAllowed) return false;
  if (config.guidedRequired) return true;
  return (
    page.page_type === "checkpoint" ||
    page.page_type === "comparison" ||
    page.page_type === "timer"
  );
}
