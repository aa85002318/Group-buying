/** Shared Story Book page sequence for flip + full renderers (single data source). */

import type { FlatStoryPage } from "@/components/recipes/storybook/StoryPageView";
import type { RecipeReaderSettings } from "@/lib/recipes/reader-settings";
import { flattenStoryPages, type StorybookPayload } from "@/lib/recipes/storybook";

export type ReaderPage = FlatStoryPage & { __synthetic?: "cover" | "toc" };

export const SYNTH_COVER_ID = "__v3_cover__";
export const SYNTH_TOC_ID = "__v3_toc__";

/** Celebration-style completion pages — hide from all readers. */
export function isCelebrationCompletionPage(page: {
  page_type?: string | null;
  title?: string | null;
  body?: string | null;
}): boolean {
  if (page.page_type !== "completion") return false;
  const title = page.title ?? "";
  if (/恭喜完成|謝謝觀看|DEMO\s*食譜|結束導覽/i.test(title)) return true;
  // Bare completion shells with no real teaching content
  if (!page.body?.trim()) return true;
  return false;
}

export function buildReaderPages(
  chapters: StorybookPayload["chapters"],
  recipeTitle: string,
  settings: RecipeReaderSettings
): ReaderPage[] {
  const raw = flattenStoryPages(chapters) as FlatStoryPage[];
  const filtered = raw.filter((p) => {
    if (p.page_type === "scale") return false;
    if (p.active === false) return false;
    if (isCelebrationCompletionPage(p)) return false;
    return true;
  });

  const synthCover = (): ReaderPage =>
    ({
      id: SYNTH_COVER_ID,
      recipe_id: filtered[0]?.recipe_id ?? "",
      chapter_id: null,
      step_id: null,
      page_type: "cover",
      layout_type: "full_bleed",
      title: recipeTitle,
      subtitle: "開始閱讀",
      body: null,
      eyebrow: "CHIMEIDIY 翻頁教材",
      alignment: "bottom_left",
      content_config: { ctaPrimary: "開始閱讀" },
      completion_config: {},
      ai_context: null,
      sort_order: -2,
      active: true,
      created_at: "",
      updated_at: "",
      recipe_story_page_media: [],
      __synthetic: "cover",
    }) as ReaderPage;

  const synthToc = (): ReaderPage =>
    ({
      id: SYNTH_TOC_ID,
      recipe_id: filtered[0]?.recipe_id ?? "",
      chapter_id: null,
      step_id: null,
      page_type: "toc",
      layout_type: "list",
      title: "Recipe Contents",
      subtitle: "食譜目錄",
      body: null,
      eyebrow: null,
      alignment: "top_left",
      content_config: {},
      completion_config: {},
      ai_context: null,
      sort_order: -1,
      active: true,
      created_at: "",
      updated_at: "",
      recipe_story_page_media: [],
      __synthetic: "toc",
    }) as ReaderPage;

  const pages: ReaderPage[] = [];
  const hasCover = filtered.some((p) => p.page_type === "cover");
  const needSynthToc = settings.showToc && !filtered.some((p) => p.page_type === "toc");

  if (!hasCover) pages.push(synthCover());

  let tocPlaced = !needSynthToc;
  for (const p of filtered) {
    if (!settings.showProducts && p.page_type === "recommendations") continue;
    if (!settings.showGallery && (p.page_type === "gallery" || p.page_type === "submissions"))
      continue;
    if (!settings.showChallenge && p.page_type === "challenge") continue;

    pages.push(p);
    if (p.page_type === "cover" && needSynthToc && !tocPlaced) {
      pages.push(synthToc());
      tocPlaced = true;
    }
  }

  if (needSynthToc && !tocPlaced) {
    const coverIdx = pages.findIndex((p) => p.page_type === "cover");
    pages.splice(coverIdx >= 0 ? coverIdx + 1 : 0, 0, synthToc());
  }

  return pages;
}

export function pageAnchorId(pageId: string): string {
  return `story-page-${pageId}`;
}

export function tocLabelForPage(page: ReaderPage): string {
  if (page.page_type === "cover") return "封面";
  if (page.page_type === "toc") return "目錄";
  return page.title || page.chapter?.title || page.page_type;
}
