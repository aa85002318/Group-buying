import type { RecipeMedia, RecipeVideoMarker } from "@/lib/types/database";

export function formatMediaTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function getRecipeLevelMedia(media: RecipeMedia[]): RecipeMedia[] {
  return media
    .filter((m) => m.is_active !== false && !m.step_id)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getStepMedia(media: RecipeMedia[], stepId: string): RecipeMedia[] {
  return media
    .filter((m) => m.is_active !== false && m.step_id === stepId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function pickPrimaryVideo(items: RecipeMedia[]): RecipeMedia | null {
  return items.find((m) => m.media_type === "video") ?? null;
}

export function pickKeyframes(items: RecipeMedia[]): RecipeMedia[] {
  return items.filter((m) => m.media_type === "keyframe" || m.media_type === "image");
}

export function sortedMarkers(media: RecipeMedia | null | undefined): RecipeVideoMarker[] {
  const list = media?.recipe_video_markers ?? [];
  return [...list].sort(
    (a, b) => a.sort_order - b.sort_order || a.time_seconds - b.time_seconds
  );
}

export type RecipePlaybackContext = {
  mediaId: string | null;
  currentTimeSeconds: number;
  markerId: string | null;
  markerTitle: string | null;
  markerAiContext: string | null;
};
