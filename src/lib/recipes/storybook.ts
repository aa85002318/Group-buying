import type {
  RecipeStoryChapter,
  RecipeStoryPage,
  RecipeStoryPageMedia,
} from "@/lib/types/database";

export type StorybookPayload = {
  chapters: Array<
    RecipeStoryChapter & {
      recipe_story_pages: Array<
        RecipeStoryPage & { recipe_story_page_media: RecipeStoryPageMedia[] }
      >;
    }
  >;
  flatPages: Array<
    RecipeStoryPage & {
      recipe_story_page_media: RecipeStoryPageMedia[];
      chapter?: RecipeStoryChapter | null;
    }
  >;
};

export function hasActiveStorybook(
  chapters: RecipeStoryChapter[] | null | undefined
): boolean {
  if (!chapters?.length) return false;
  return chapters.some(
    (c) =>
      c.active !== false &&
      (c.recipe_story_pages ?? []).some((p) => p.active !== false)
  );
}

export function flattenStoryPages(
  chapters: StorybookPayload["chapters"]
): StorybookPayload["flatPages"] {
  const orderedChapters = [...chapters]
    .filter((c) => c.active !== false)
    .sort((a, b) => a.sort_order - b.sort_order);

  const pages: StorybookPayload["flatPages"] = [];
  for (const ch of orderedChapters) {
    const chPages = [...(ch.recipe_story_pages ?? [])]
      .filter((p) => p.active !== false)
      .sort((a, b) => a.sort_order - b.sort_order);
    for (const p of chPages) {
      const media = [...(p.recipe_story_page_media ?? [])]
        .filter((m) => m.active !== false)
        .sort((a, b) => a.sort_order - b.sort_order);
      pages.push({
        ...p,
        recipe_story_page_media: media,
        chapter: ch,
      });
    }
  }
  return pages;
}

export function nestChaptersWithPages(
  chapters: RecipeStoryChapter[],
  pages: RecipeStoryPage[],
  media: RecipeStoryPageMedia[]
): StorybookPayload["chapters"] {
  const mediaByPage = new Map<string, RecipeStoryPageMedia[]>();
  for (const m of media) {
    if (m.active === false) continue;
    const list = mediaByPage.get(m.story_page_id) ?? [];
    list.push(m);
    mediaByPage.set(m.story_page_id, list);
  }
  for (const list of Array.from(mediaByPage.values())) {
    list.sort((a: RecipeStoryPageMedia, b: RecipeStoryPageMedia) => a.sort_order - b.sort_order);
  }

  const pagesByChapter = new Map<string, RecipeStoryPage[]>();
  for (const p of pages) {
    if (p.active === false || !p.chapter_id) continue;
    const list = pagesByChapter.get(p.chapter_id) ?? [];
    list.push({
      ...p,
      recipe_story_page_media: mediaByPage.get(p.id) ?? [],
    });
    pagesByChapter.set(p.chapter_id, list);
  }
  for (const list of Array.from(pagesByChapter.values())) {
    list.sort((a: RecipeStoryPage, b: RecipeStoryPage) => a.sort_order - b.sort_order);
  }

  return [...chapters]
    .filter((c) => c.active !== false)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      ...c,
      recipe_story_pages: (pagesByChapter.get(c.id) ?? []) as Array<
        RecipeStoryPage & { recipe_story_page_media: RecipeStoryPageMedia[] }
      >,
    }));
}
