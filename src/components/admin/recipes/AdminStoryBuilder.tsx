"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  STORY_LAYOUT_LABELS,
  STORY_PAGE_TYPE_LABELS,
  STORY_PAGE_TYPES_V3,
  defaultsForStoryIntent,
  type RecipeStoryAlignment,
  type RecipeStoryLayoutType,
  type RecipeStoryPageType,
  type StoryCheckpointItem,
  type StoryComparisonOption,
  type StoryContentConfig,
  type StoryCompletionConfig,
  type StorySplitDirection,
} from "@/lib/recipes/story-types";
import type {
  RecipeStep,
  RecipeStoryChapter,
  RecipeStoryPage,
  RecipeStoryPageMedia,
} from "@/lib/types/database";
import { AdminRecipeVideoUpload } from "@/components/admin/recipes/AdminRecipeVideoUpload";

type PageWithMedia = RecipeStoryPage & {
  recipe_story_page_media: RecipeStoryPageMedia[];
};

type ChapterWithPages = RecipeStoryChapter & {
  recipe_story_pages: PageWithMedia[];
};

type RecipeMediaOption = {
  id?: string;
  media_type: string;
  url: string;
  thumbnail_url?: string;
  alt_text?: string;
};

type Selection =
  | { kind: "chapter"; chapterId: string }
  | { kind: "page"; pageId: string }
  | null;

type PreviewMode = "phone" | "desktop";

const PAGE_TYPE_OPTIONS = [
  ...STORY_PAGE_TYPES_V3,
  ...(Object.keys(STORY_PAGE_TYPE_LABELS) as RecipeStoryPageType[]).filter(
    (t) => !STORY_PAGE_TYPES_V3.includes(t) && t !== "scale"
  ),
];
const LAYOUT_OPTIONS = Object.keys(STORY_LAYOUT_LABELS) as RecipeStoryLayoutType[];
const ALIGNMENT_OPTIONS: { value: RecipeStoryAlignment; label: string }[] = [
  { value: "top_left", label: "左上" },
  { value: "bottom_left", label: "左下" },
  { value: "center", label: "置中" },
  { value: "bottom_right", label: "右下" },
];

const WIZARD_INTENTS: { intent: string; label: string; hint: string }[] = [
  { intent: "cover", label: "封面", hint: "全版封面頁" },
  { intent: "toc", label: "目錄", hint: "食譜目錄跳頁" },
  { intent: "full_image", label: "全版圖片", hint: "單張圖片頁" },
  { intent: "video", label: "影片", hint: "影片為主角的教學頁" },
  { intent: "image_text", label: "圖文", hint: "圖文內容頁" },
  { intent: "step", label: "製作步驟", hint: "步驟頁（可附影片）" },
  { intent: "challenge", label: "食譜挑戰", hint: "挑戰頁（需食譜開關）" },
  { intent: "gallery", label: "成品分享", hint: "作品上傳／作品牆" },
  { intent: "completion", label: "完成", hint: "完成頁" },
  { intent: "recommendations", label: "推薦商品", hint: "商品推薦（需開關）" },
];

const SPLIT_OPTIONS: { value: StorySplitDirection; label: string }[] = [
  { value: "image_left", label: "圖左文右" },
  { value: "image_right", label: "圖右文左" },
  { value: "image_top", label: "圖上文下" },
  { value: "image_bottom", label: "圖下文上" },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseContentConfig(value: unknown): StoryContentConfig {
  return asRecord(value) as StoryContentConfig;
}

function parseCompletionConfig(value: unknown): StoryCompletionConfig {
  return asRecord(value) as StoryCompletionConfig;
}

function newLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type Props = {
  recipeId: string;
  recipeMedia: RecipeMediaOption[];
  steps: RecipeStep[];
};

export function AdminStoryBuilder({ recipeId, recipeMedia, steps }: Props) {
  const [chapters, setChapters] = useState<ChapterWithPages[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("phone");
  const [wizardChapterId, setWizardChapterId] = useState<string | null>(null);
  const [listMode, setListMode] = useState<"pages" | "chapters">("pages");
  const [mediaUrlDraft, setMediaUrlDraft] = useState("");
  const [mediaTypeDraft, setMediaTypeDraft] = useState<"image" | "video" | "keyframe">("image");
  const [pickRecipeMedia, setPickRecipeMedia] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}/stories`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      const next = (data.chapters ?? []) as ChapterWithPages[];
      setChapters(next);
      setSelection((prev) => {
        if (!prev) {
          const firstChapter = next[0];
          const firstPage = firstChapter?.recipe_story_pages?.[0];
          if (firstPage) return { kind: "page", pageId: firstPage.id };
          if (firstChapter) return { kind: "chapter", chapterId: firstChapter.id };
          return null;
        }
        if (prev.kind === "chapter") {
          return next.some((c) => c.id === prev.chapterId) ? prev : null;
        }
        const pageExists = next.some((c) =>
          (c.recipe_story_pages ?? []).some((p) => p.id === prev.pageId)
        );
        return pageExists ? prev : null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  const postAction = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "操作失敗");
      await loadStories();
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "操作失敗";
      setError(message);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const selectedChapter = useMemo(() => {
    if (selection?.kind === "chapter") {
      return chapters.find((c) => c.id === selection.chapterId) ?? null;
    }
    if (selection?.kind === "page") {
      return (
        chapters.find((c) =>
          (c.recipe_story_pages ?? []).some((p) => p.id === selection.pageId)
        ) ?? null
      );
    }
    return null;
  }, [chapters, selection]);

  const selectedPage = useMemo((): PageWithMedia | null => {
    if (selection?.kind !== "page") return null;
    for (const ch of chapters) {
      const page = ch.recipe_story_pages.find((p) => p.id === selection.pageId);
      if (page) {
        return {
          ...page,
          recipe_story_page_media: page.recipe_story_page_media ?? [],
        };
      }
    }
    return null;
  }, [chapters, selection]);

  const flatPages = useMemo(() => {
    const orderedChapters = [...chapters].sort((a, b) => a.sort_order - b.sort_order);
    const rows: Array<{
      page: PageWithMedia;
      chapter: ChapterWithPages;
      globalIndex: number;
    }> = [];
    let i = 0;
    for (const ch of orderedChapters) {
      const pages = [...(ch.recipe_story_pages ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      for (const page of pages) {
        rows.push({
          page: {
            ...page,
            recipe_story_page_media: page.recipe_story_page_media ?? [],
          },
          chapter: ch,
          globalIndex: i++,
        });
      }
    }
    return rows;
  }, [chapters]);

  const ensureChapterForNewPage = async (): Promise<string | null> => {
    if (chapters.length > 0) {
      const ordered = [...chapters].sort((a, b) => a.sort_order - b.sort_order);
      return ordered[ordered.length - 1]?.id ?? null;
    }
    const data = await postAction({
      action: "create_chapter",
      title: "教材內容",
      chapter_number: 1,
      sort_order: 0,
    });
    return (data.chapter?.id as string) ?? null;
  };

  const openNewPageWizard = async () => {
    const chapterId = await ensureChapterForNewPage();
    if (chapterId) setWizardChapterId(chapterId);
  };

  const addChapter = async () => {
    const sort_order = chapters.length;
    const data = await postAction({
      action: "create_chapter",
      title: `章節 ${sort_order + 1}`,
      chapter_number: sort_order + 1,
      sort_order,
    });
    if (data.chapter?.id) {
      setSelection({ kind: "chapter", chapterId: data.chapter.id });
    }
  };

  const openPageWizard = (chapterId: string) => {
    setWizardChapterId(chapterId);
  };

  const createPageFromIntent = async (intent: string) => {
    if (!wizardChapterId) return;
    const chapter = chapters.find((c) => c.id === wizardChapterId);
    const defaults = defaultsForStoryIntent(intent);
    const sort_order = chapter?.recipe_story_pages?.length ?? 0;
    const data = await postAction({
      action: "create_page",
      chapter_id: wizardChapterId,
      page_type: defaults.page_type,
      layout_type: defaults.layout_type,
      title: WIZARD_INTENTS.find((w) => w.intent === intent)?.label ?? "新頁面",
      sort_order,
      content_config: {},
      completion_config: {},
    });
    setWizardChapterId(null);
    if (data.page?.id) {
      setSelection({ kind: "page", pageId: data.page.id });
    }
  };

  const duplicatePage = async (pageId: string) => {
    const data = await postAction({ action: "duplicate_page", id: pageId });
    if (data.page?.id) setSelection({ kind: "page", pageId: data.page.id });
  };

  const deleteChapter = async (chapterId: string) => {
    if (!confirm("確定刪除此章節及其頁面？")) return;
    await postAction({ action: "delete_chapter", id: chapterId });
    setSelection(null);
  };

  const deletePage = async (pageId: string) => {
    if (!confirm("確定刪除此頁面？")) return;
    await postAction({ action: "delete_page", id: pageId });
    setSelection(null);
  };

  const moveChapter = async (chapterId: string, dir: -1 | 1) => {
    const ordered = [...chapters].sort((a, b) => a.sort_order - b.sort_order);
    const idx = ordered.findIndex((c) => c.id === chapterId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    await postAction({
      action: "reorder",
      chapters: next.map((c, i) => ({ id: c.id, sort_order: i })),
      pages: [],
    });
  };

  const movePage = async (pageId: string, dir: -1 | 1) => {
    const chapter = chapters.find((c) =>
      (c.recipe_story_pages ?? []).some((p) => p.id === pageId)
    );
    if (!chapter) return;
    const ordered = [...(chapter.recipe_story_pages ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const idx = ordered.findIndex((p) => p.id === pageId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    await postAction({
      action: "reorder",
      chapters: [],
      pages: next.map((p, i) => ({
        id: p.id,
        chapter_id: chapter.id,
        sort_order: i,
      })),
    });
  };

  /** Flat-list reorder: same chapter uses local move; cross-chapter reassigns chapter. */
  const movePageGlobal = async (pageId: string, dir: -1 | 1) => {
    const idx = flatPages.findIndex((r) => r.page.id === pageId);
    const neighbor = flatPages[idx + dir];
    if (idx < 0 || !neighbor) return;
    const current = flatPages[idx];
    if (current.chapter.id === neighbor.chapter.id) {
      await movePage(pageId, dir);
      return;
    }
    const targetPages = [...(neighbor.chapter.recipe_story_pages ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    await postAction({
      action: "update_page",
      id: pageId,
      chapter_id: neighbor.chapter.id,
      sort_order: dir > 0 ? targetPages.length : 0,
    });
  };

  const saveChapter = async (patch: Partial<RecipeStoryChapter>) => {
    if (!selectedChapter) return;
    await postAction({
      action: "update_chapter",
      id: selectedChapter.id,
      ...patch,
    });
  };

  const savePage = async (patch: Record<string, unknown>) => {
    if (!selectedPage) return;
    await postAction({
      action: "update_page",
      id: selectedPage.id,
      ...patch,
    });
  };

  const updateContentConfig = async (patch: Partial<StoryContentConfig>) => {
    if (!selectedPage) return;
    const next = { ...parseContentConfig(selectedPage.content_config), ...patch };
    await savePage({ content_config: next });
  };

  const updateCompletionConfig = async (patch: Partial<StoryCompletionConfig>) => {
    if (!selectedPage) return;
    const next = { ...parseCompletionConfig(selectedPage.completion_config), ...patch };
    await savePage({ completion_config: next });
  };

  const upsertMedia = async (payload: Record<string, unknown>) => {
    if (!selectedPage) return;
    await postAction({
      action: "upsert_media",
      story_page_id: selectedPage.id,
      ...payload,
    });
  };

  const addMediaByUrl = async (url: string, media_type: "image" | "video" | "keyframe") => {
    if (!selectedPage || !url.trim()) return;
    if (media_type === "video") {
      setError("影片請使用下方「上傳影片檔案」，不可貼 YouTube／外部影片連結");
      return;
    }
    const lower = url.trim().toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo.com")) {
      setError("不可使用 YouTube／Vimeo 連結");
      return;
    }
    const sort_order = selectedPage.recipe_story_page_media?.length ?? 0;
    await upsertMedia({
      url: url.trim(),
      media_type,
      source_type: "cdn",
      sort_order,
    });
    setMediaUrlDraft("");
  };

  const uploadMediaFile = async (file: File) => {
    if (!selectedPage) return;
    if (file.type.startsWith("video/")) {
      setError("請使用「上傳 Story 影片」區塊上傳影片檔案");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "recipe-media");
      formData.append("folder", `recipes/${recipeId}/story-pages/${selectedPage.id}`);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上傳失敗");
      await upsertMedia({
        url: data.url,
        media_type: "image",
        source_type: "upload",
        sort_order: selectedPage.recipe_story_page_media?.length ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const deleteMedia = async (mediaId: string) => {
    await postAction({ action: "delete_media", id: mediaId });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">載入圖文影音教學集…</p>;
  }

  const content = selectedPage ? parseContentConfig(selectedPage.content_config) : {};
  const completion = selectedPage
    ? parseCompletionConfig(selectedPage.completion_config)
    : {};
  const pageMedia = selectedPage?.recipe_story_page_media ?? [];
  const previewImage =
    pageMedia.find((m) => m.media_type === "image")?.url ??
    pageMedia[0]?.thumbnail_url ??
    pageMedia[0]?.url ??
    null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium">圖文影音教學集</h3>
          <p className="text-sm text-muted-foreground">
            V3：一頁就是一頁。左側頁面列表 · 中央預覽 · 右側完整內容（類型／圖／影／文／Popup）
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={listMode === "pages" ? "default" : "outline"}
            type="button"
            onClick={() => setListMode("pages")}
          >
            頁面列表
          </Button>
          <Button
            size="sm"
            variant={listMode === "chapters" ? "default" : "outline"}
            type="button"
            onClick={() => setListMode("chapters")}
          >
            章節樹
          </Button>
          <Button size="sm" variant="outline" onClick={() => void loadStories()} disabled={busy}>
            重新載入
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        {/* Left: flat pages (default) or chapter tree */}
        <aside className="space-y-2 rounded-lg border bg-white p-3">
          {listMode === "pages" ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">頁面（閱讀順序）</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void openNewPageWizard()}
                >
                  新增頁面
                </Button>
              </div>
              {flatPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  尚無頁面。點「新增頁面」開始編輯教材。
                </p>
              ) : null}
              <div className="max-h-[70vh] space-y-1 overflow-y-auto">
                {flatPages.map((row, idx) => {
                  const pageSelected =
                    selection?.kind === "page" && selection.pageId === row.page.id;
                  const typeLabel =
                    STORY_PAGE_TYPE_LABELS[row.page.page_type as RecipeStoryPageType] ??
                    row.page.page_type;
                  return (
                    <div
                      key={row.page.id}
                      className={`flex items-start gap-1 rounded-lg border px-2 py-1.5 ${
                        pageSelected ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          setSelection({ kind: "page", pageId: row.page.id })
                        }
                      >
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {String(idx + 1).padStart(2, "0")} · {typeLabel}
                        </span>
                        <span className="block truncate text-sm font-medium">
                          {row.page.title || "未命名頁面"}
                        </span>
                      </button>
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1 text-xs"
                          disabled={busy || idx === 0}
                          onClick={() => void movePageGlobal(row.page.id, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1 text-xs"
                          disabled={busy || idx === flatPages.length - 1}
                          onClick={() => void movePageGlobal(row.page.id, 1)}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">章節／頁面</p>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void addChapter()}>
              新增章節
            </Button>
          </div>

          {chapters.length === 0 && (
            <p className="text-sm text-muted-foreground">尚無章節，請先新增章節。</p>
          )}

          <div className="max-h-[70vh] space-y-2 overflow-y-auto">
            {chapters.map((ch, chIdx) => {
              const pages = [...(ch.recipe_story_pages ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order
              );
              const chapterSelected =
                selection?.kind === "chapter" && selection.chapterId === ch.id;
              return (
                <div key={ch.id} className="rounded-lg border">
                  <div
                    className={`flex items-start gap-1 px-2 py-1.5 ${
                      chapterSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left text-sm font-medium"
                      onClick={() => setSelection({ kind: "chapter", chapterId: ch.id })}
                    >
                      <span className="block truncate">
                        {ch.chapter_number != null ? `${ch.chapter_number}. ` : ""}
                        {ch.title || "未命名章節"}
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1 text-xs"
                        disabled={busy || chIdx === 0}
                        onClick={() => void moveChapter(ch.id, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1 text-xs"
                        disabled={busy || chIdx === chapters.length - 1}
                        onClick={() => void moveChapter(ch.id, 1)}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 border-t px-1 py-1">
                    {pages.map((page, pageIdx) => {
                      const pageSelected =
                        selection?.kind === "page" && selection.pageId === page.id;
                      const typeLabel =
                        STORY_PAGE_TYPE_LABELS[page.page_type as RecipeStoryPageType] ??
                        page.page_type;
                      return (
                        <div
                          key={page.id}
                          className={`flex items-center gap-1 rounded-md px-1.5 py-1 ${
                            pageSelected ? "bg-primary/10" : "hover:bg-muted/40"
                          }`}
                        >
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => setSelection({ kind: "page", pageId: page.id })}
                          >
                            <span className="block truncate text-sm">
                              {page.title || "未命名頁面"}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {typeLabel}
                            </span>
                          </button>
                          <div className="flex shrink-0 flex-col">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1 text-[10px]"
                              disabled={busy || pageIdx === 0}
                              onClick={() => void movePage(page.id, -1)}
                            >
                              ↑
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1 text-[10px]"
                              disabled={busy || pageIdx === pages.length - 1}
                              onClick={() => void movePage(page.id, 1)}
                            >
                              ↓
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex flex-wrap gap-1 px-1 pb-1 pt-0.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={busy}
                        onClick={() => openPageWizard(ch.id)}
                      >
                        新增頁面
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-600"
                        disabled={busy}
                        onClick={() => void deleteChapter(ch.id)}
                      >
                        刪章節
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
            </>
          )}
        </aside>

        {/* Center: preview */}
        <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">即時預覽</p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={previewMode === "phone" ? "default" : "outline"}
                onClick={() => setPreviewMode("phone")}
              >
                Phone
              </Button>
              <Button
                size="sm"
                variant={previewMode === "desktop" ? "default" : "outline"}
                onClick={() => setPreviewMode("desktop")}
              >
                Desktop
              </Button>
            </div>
          </div>

          <div className="flex min-h-[520px] items-start justify-center overflow-auto py-2">
            <div
              className={`overflow-hidden rounded-[28px] border-2 border-slate-800 bg-white shadow-lg ${
                previewMode === "phone" ? "w-[390px]" : "w-full max-w-3xl rounded-xl"
              }`}
              style={
                previewMode === "phone"
                  ? { minHeight: 720, aspectRatio: "390 / 844" }
                  : { minHeight: 480 }
              }
            >
              {!selectedPage && selection?.kind === "chapter" && selectedChapter ? (
                <ChapterPreview chapter={selectedChapter} />
              ) : selectedPage ? (
                <PagePreview
                  page={selectedPage}
                  imageUrl={previewImage}
                  content={content}
                  completion={completion}
                />
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center p-6 text-sm text-muted-foreground">
                  選擇章節或頁面以預覽
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: editor */}
        <aside className="max-h-[78vh] space-y-3 overflow-y-auto rounded-lg border bg-white p-3">
          {selection?.kind === "chapter" && selectedChapter ? (
            <ChapterEditor
              chapter={selectedChapter}
              busy={busy}
              onSave={(patch) => void saveChapter(patch)}
              onAddPage={() => openPageWizard(selectedChapter.id)}
              onDelete={() => void deleteChapter(selectedChapter.id)}
            />
          ) : selectedPage ? (
            <PageEditor
              page={selectedPage}
              recipeId={recipeId}
              steps={steps}
              busy={busy}
              content={content}
              completion={completion}
              pageMedia={pageMedia}
              recipeMedia={recipeMedia}
              mediaUrlDraft={mediaUrlDraft}
              mediaTypeDraft={mediaTypeDraft}
              pickRecipeMedia={pickRecipeMedia}
              uploadRef={uploadRef}
              onMediaUrlDraft={setMediaUrlDraft}
              onMediaTypeDraft={setMediaTypeDraft}
              onPickRecipeMedia={setPickRecipeMedia}
              onSavePage={(patch) => void savePage(patch)}
              onUpdateContent={updateContentConfig}
              onUpdateCompletion={updateCompletionConfig}
              onDuplicate={() => void duplicatePage(selectedPage.id)}
              onDelete={() => void deletePage(selectedPage.id)}
              onAddMediaUrl={() => void addMediaByUrl(mediaUrlDraft, mediaTypeDraft)}
              onAddFromRecipeMedia={() => {
                const item = recipeMedia.find((m) => (m.id ?? m.url) === pickRecipeMedia);
                if (!item?.url) return;
                if (item.media_type === "video") {
                  setError("請用「上傳 Story 影片」綁定已上傳檔案，或於封面與完整影片上傳後再以引用加入");
                  return;
                }
                void addMediaByUrl(item.url, "image");
                setPickRecipeMedia("");
              }}
              onUploadFile={(file) => void uploadMediaFile(file)}
              onDeleteMedia={(id) => void deleteMedia(id)}
              onVideoUploaded={() => void loadStories()}
            />
          ) : (
            <p className="text-sm text-muted-foreground">選擇左側章節或頁面開始編輯。</p>
          )}
        </aside>
      </div>

      {wizardChapterId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-medium">選擇頁面類型</h4>
                <p className="text-sm text-muted-foreground">以意圖快速建立頁面預設版型</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setWizardChapterId(null)}>
                取消
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {WIZARD_INTENTS.map((item) => (
                <button
                  key={item.intent}
                  type="button"
                  disabled={busy}
                  className="rounded-lg border p-4 text-left transition hover:border-primary hover:bg-primary/5"
                  onClick={() => void createPageFromIntent(item.intent)}
                >
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ChapterPreview({ chapter }: { chapter: ChapterWithPages }) {
  return (
    <div className="relative flex h-full min-h-[420px] flex-col justify-end bg-gradient-to-b from-slate-200 to-slate-800 p-6 text-white">
      {chapter.cover_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={chapter.cover_image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="relative z-10 space-y-2 bg-gradient-to-t from-black/70 to-transparent pt-16">
        <p className="text-xs uppercase tracking-wide opacity-80">Chapter</p>
        <h3 className="text-2xl font-semibold">{chapter.title}</h3>
        {chapter.subtitle ? <p className="text-sm opacity-90">{chapter.subtitle}</p> : null}
      </div>
    </div>
  );
}

function PagePreview({
  page,
  imageUrl,
  content,
  completion,
}: {
  page: PageWithMedia;
  imageUrl: string | null;
  content: StoryContentConfig;
  completion: StoryCompletionConfig;
}) {
  const typeLabel =
    STORY_PAGE_TYPE_LABELS[page.page_type as RecipeStoryPageType] ?? page.page_type;
  const align = page.alignment ?? "bottom_left";
  const alignClass =
    align === "center"
      ? "items-center justify-center text-center"
      : align === "top_left"
        ? "items-start justify-start"
        : align === "bottom_right"
          ? "items-end justify-end text-right"
          : "items-start justify-end";

  if (page.layout_type === "full_bleed" || page.page_type === "full_image") {
    return (
      <div className="relative flex h-full min-h-[420px] flex-col bg-slate-900 text-white">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-900" />
        )}
        <div className={`relative z-10 flex flex-1 flex-col p-6 ${alignClass}`}>
          <div className="max-w-sm space-y-2 rounded-lg bg-black/45 p-4 backdrop-blur-sm">
            {page.eyebrow ? <p className="text-xs opacity-80">{page.eyebrow}</p> : null}
            <h3 className="text-2xl font-semibold">{page.title || typeLabel}</h3>
            {page.subtitle ? <p className="text-sm opacity-90">{page.subtitle}</p> : null}
            {page.body ? <p className="text-sm opacity-85">{page.body}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  if (page.layout_type === "timer" || page.page_type === "timer") {
    const seconds = content.timerSeconds ?? 60;
    return (
      <div className="flex h-full min-h-[420px] flex-col bg-white p-6">
        <p className="text-xs text-muted-foreground">{typeLabel}</p>
        <h3 className="mt-2 text-xl font-semibold">{page.title || "計時"}</h3>
        {page.body ? <p className="mt-2 text-sm text-muted-foreground">{page.body}</p> : null}
        <div className="mt-10 flex flex-1 flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground">{content.timerLabel || "倒數"}</p>
          <p className="mt-2 text-5xl font-semibold tabular-nums">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </p>
          <div className="mt-6 flex gap-2">
            <span className="rounded-md border px-3 py-1.5 text-sm">
              {content.ctaPrimary || "開始"}
            </span>
            <span className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground">
              {content.ctaSecondary || "略過"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (page.layout_type === "comparison" || page.page_type === "comparison") {
    const options = content.comparisonOptions ?? [];
    return (
      <div className="flex h-full min-h-[420px] flex-col bg-white p-5">
        <p className="text-xs text-muted-foreground">{typeLabel}</p>
        <h3 className="mt-1 text-xl font-semibold">{page.title || "狀態比較"}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {content.comparisonPrompt || page.subtitle || "請選擇最接近的狀態"}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(options.length ? options : [{ id: "a", label: "選項 A" }, { id: "b", label: "選項 B" }]).map(
            (opt) => (
              <div key={opt.id} className="overflow-hidden rounded-lg border">
                <div className="aspect-[4/3] bg-slate-100">
                  {opt.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opt.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium">{opt.label}</p>
                  {opt.caption ? (
                    <p className="text-xs text-muted-foreground">{opt.caption}</p>
                  ) : null}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  if (page.layout_type === "checkpoint" || page.page_type === "checkpoint") {
    const items = completion.checklist ?? [];
    return (
      <div className="flex h-full min-h-[420px] flex-col bg-white p-5">
        <p className="text-xs text-muted-foreground">{typeLabel}</p>
        <h3 className="mt-1 text-xl font-semibold">{page.title || "完成檢查"}</h3>
        {page.body ? <p className="mt-2 text-sm text-muted-foreground">{page.body}</p> : null}
        <ul className="mt-4 space-y-2">
          {(items.length ? items : [{ id: "1", text: "檢查項目" }]).map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <span className="inline-block h-4 w-4 rounded border" />
              {item.text}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6">
          <span className="inline-block rounded-md border px-3 py-1.5 text-sm">
            {completion.continueLabel || content.ctaPrimary || "繼續"}
          </span>
        </div>
      </div>
    );
  }

  if (page.layout_type === "gallery" || page.page_type === "gallery") {
    const frames = content.frames ?? [];
    return (
      <div className="flex h-full min-h-[420px] flex-col bg-white p-5">
        <p className="text-xs text-muted-foreground">{typeLabel}</p>
        <h3 className="mt-1 text-xl font-semibold">{page.title || "多圖步驟"}</h3>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(frames.length
            ? frames
            : page.recipe_story_page_media.map((m, i) => ({
                id: m.id,
                title: `圖 ${i + 1}`,
                imageUrl: m.url,
                caption: m.caption ?? undefined,
              }))
          )
            .slice(0, 4)
            .map((frame, i) => (
              <div key={frame.id ?? i} className="overflow-hidden rounded-lg border">
                <div className="aspect-square bg-slate-100">
                  {frame.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={frame.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium">{frame.title || `步驟 ${i + 1}`}</p>
                  {frame.caption ? (
                    <p className="text-[11px] text-muted-foreground">{frame.caption}</p>
                  ) : null}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (page.layout_type === "video_lead" || page.page_type === "step_video" || page.page_type === "full_video") {
    return (
      <div className="flex h-full min-h-[420px] flex-col bg-black text-white">
        <div className="relative aspect-video bg-slate-800">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-80" />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-white/70 px-4 py-2 text-sm">播放</span>
          </div>
          {(content.startSeconds != null || content.endSeconds != null) && (
            <p className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[11px]">
              {content.startSeconds ?? 0}s – {content.endSeconds ?? "…"}s
            </p>
          )}
        </div>
        <div className="space-y-2 p-5">
          {page.eyebrow ? <p className="text-xs opacity-70">{page.eyebrow}</p> : null}
          <h3 className="text-xl font-semibold">{page.title || typeLabel}</h3>
          {page.subtitle ? <p className="text-sm opacity-80">{page.subtitle}</p> : null}
          {page.body ? <p className="text-sm opacity-75">{page.body}</p> : null}
        </div>
      </div>
    );
  }

  // Default: image + text split / introduction mock
  const imageLeft =
    content.splitDirection === "image_right" || content.splitDirection === "image_bottom"
      ? false
      : true;
  const vertical =
    content.splitDirection === "image_top" || content.splitDirection === "image_bottom";

  return (
    <div
      className={`flex h-full min-h-[420px] bg-white ${
        vertical ? "flex-col" : imageLeft ? "flex-col sm:flex-row" : "flex-col-reverse sm:flex-row-reverse"
      }`}
    >
      <div className={`bg-slate-100 ${vertical ? "aspect-[16/10]" : "min-h-[200px] flex-1"}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            尚無媒體
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center space-y-2 p-5">
        <p className="text-xs text-muted-foreground">{typeLabel}</p>
        {page.eyebrow ? <p className="text-xs font-medium text-primary">{page.eyebrow}</p> : null}
        <h3 className="text-xl font-semibold">{page.title || "未命名頁面"}</h3>
        {page.subtitle ? <p className="text-sm text-muted-foreground">{page.subtitle}</p> : null}
        {page.body ? <p className="text-sm leading-relaxed text-slate-700">{page.body}</p> : null}
        {(content.ctaPrimary || content.ctaSecondary) && (
          <div className="flex gap-2 pt-2">
            {content.ctaPrimary ? (
              <span className="rounded-md border px-3 py-1.5 text-sm">{content.ctaPrimary}</span>
            ) : null}
            {content.ctaSecondary ? (
              <span className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground">
                {content.ctaSecondary}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ChapterEditor({
  chapter,
  busy,
  onSave,
  onAddPage,
  onDelete,
}: {
  chapter: ChapterWithPages;
  busy: boolean;
  onSave: (patch: Partial<RecipeStoryChapter>) => void;
  onAddPage: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(chapter.title);
  const [subtitle, setSubtitle] = useState(chapter.subtitle ?? "");
  const [chapterNumber, setChapterNumber] = useState(
    chapter.chapter_number != null ? String(chapter.chapter_number) : ""
  );
  const [coverImage, setCoverImage] = useState(chapter.cover_image ?? "");
  const [active, setActive] = useState(chapter.active !== false);

  useEffect(() => {
    setTitle(chapter.title);
    setSubtitle(chapter.subtitle ?? "");
    setChapterNumber(chapter.chapter_number != null ? String(chapter.chapter_number) : "");
    setCoverImage(chapter.cover_image ?? "");
    setActive(chapter.active !== false);
  }, [chapter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">編輯章節</p>
        <Button size="sm" variant="outline" disabled={busy} onClick={onAddPage}>
          新增頁面
        </Button>
      </div>
      <Field label="標題">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="副標">
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </Field>
      <Field label="章節編號">
        <Input
          type="number"
          value={chapterNumber}
          onChange={(e) => setChapterNumber(e.target.value)}
        />
      </Field>
      <Field label="封面圖 URL">
        <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        啟用
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() =>
            onSave({
              title: title.trim() || "未命名章節",
              subtitle: subtitle.trim() || null,
              chapter_number: chapterNumber ? Number(chapterNumber) : null,
              cover_image: coverImage.trim() || null,
              active,
            })
          }
        >
          儲存章節
        </Button>
        <Button size="sm" variant="outline" className="text-red-600" disabled={busy} onClick={onDelete}>
          刪除章節
        </Button>
      </div>
    </div>
  );
}

function PageEditor({
  page,
  recipeId,
  steps,
  busy,
  content,
  completion,
  pageMedia,
  recipeMedia,
  mediaUrlDraft,
  mediaTypeDraft,
  pickRecipeMedia,
  uploadRef,
  onMediaUrlDraft,
  onMediaTypeDraft,
  onPickRecipeMedia,
  onSavePage,
  onUpdateContent,
  onUpdateCompletion,
  onDuplicate,
  onDelete,
  onAddMediaUrl,
  onAddFromRecipeMedia,
  onUploadFile,
  onDeleteMedia,
  onVideoUploaded,
}: {
  page: PageWithMedia;
  recipeId: string;
  steps: RecipeStep[];
  busy: boolean;
  content: StoryContentConfig;
  completion: StoryCompletionConfig;
  pageMedia: RecipeStoryPageMedia[];
  recipeMedia: RecipeMediaOption[];
  mediaUrlDraft: string;
  mediaTypeDraft: "image" | "video" | "keyframe";
  pickRecipeMedia: string;
  uploadRef: RefObject<HTMLInputElement>;
  onMediaUrlDraft: (v: string) => void;
  onMediaTypeDraft: (v: "image" | "video" | "keyframe") => void;
  onPickRecipeMedia: (v: string) => void;
  onSavePage: (patch: Record<string, unknown>) => void;
  onUpdateContent: (patch: Partial<StoryContentConfig>) => Promise<void>;
  onUpdateCompletion: (patch: Partial<StoryCompletionConfig>) => Promise<void>;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddMediaUrl: () => void;
  onAddFromRecipeMedia: () => void;
  onUploadFile: (file: File) => void;
  onDeleteMedia: (id: string) => void;
  onVideoUploaded: () => void;
}) {
  const [title, setTitle] = useState(page.title ?? "");
  const [subtitle, setSubtitle] = useState(page.subtitle ?? "");
  const [body, setBody] = useState(page.body ?? "");
  const [eyebrow, setEyebrow] = useState(page.eyebrow ?? "");
  const [pageType, setPageType] = useState(page.page_type);
  const [layoutType, setLayoutType] = useState(page.layout_type);
  const [alignment, setAlignment] = useState(page.alignment ?? "bottom_left");
  const [aiContext, setAiContext] = useState(page.ai_context ?? "");
  const [stepId, setStepId] = useState(page.step_id ?? "");
  const [active, setActive] = useState(page.active !== false);
  const [ctaPrimary, setCtaPrimary] = useState(content.ctaPrimary ?? "");
  const [ctaSecondary, setCtaSecondary] = useState(content.ctaSecondary ?? "");
  const [timerSeconds, setTimerSeconds] = useState(
    content.timerSeconds != null ? String(content.timerSeconds) : ""
  );
  const [timerLabel, setTimerLabel] = useState(content.timerLabel ?? "");
  const [splitDirection, setSplitDirection] = useState<StorySplitDirection>(
    content.splitDirection ?? "image_left"
  );
  const [guidedRequired, setGuidedRequired] = useState(Boolean(content.guidedRequired));
  const [startSeconds, setStartSeconds] = useState(
    content.startSeconds != null ? String(content.startSeconds) : ""
  );
  const [endSeconds, setEndSeconds] = useState(
    content.endSeconds != null ? String(content.endSeconds) : ""
  );
  const [comparisonPrompt, setComparisonPrompt] = useState(content.comparisonPrompt ?? "");
  const [comparisonOptions, setComparisonOptions] = useState<StoryComparisonOption[]>(
    content.comparisonOptions ?? []
  );
  const [checklist, setChecklist] = useState<StoryCheckpointItem[]>(
    completion.checklist ?? []
  );
  const [continueLabel, setContinueLabel] = useState(completion.continueLabel ?? "");
  const [cautionEnabled, setCautionEnabled] = useState(Boolean(content.cautionEnabled));
  const [cautionTitle, setCautionTitle] = useState(content.cautionTitle ?? "容易失敗");
  const [cautionItemsText, setCautionItemsText] = useState(
    (content.cautionItems ?? []).join("\n")
  );

  useEffect(() => {
    setTitle(page.title ?? "");
    setSubtitle(page.subtitle ?? "");
    setBody(page.body ?? "");
    setEyebrow(page.eyebrow ?? "");
    setPageType(page.page_type);
    setLayoutType(page.layout_type);
    setAlignment(page.alignment ?? "bottom_left");
    setAiContext(page.ai_context ?? "");
    setStepId(page.step_id ?? "");
    setActive(page.active !== false);
    const c = parseContentConfig(page.content_config);
    const done = parseCompletionConfig(page.completion_config);
    setCtaPrimary(c.ctaPrimary ?? "");
    setCtaSecondary(c.ctaSecondary ?? "");
    setTimerSeconds(c.timerSeconds != null ? String(c.timerSeconds) : "");
    setTimerLabel(c.timerLabel ?? "");
    setSplitDirection(c.splitDirection ?? "image_left");
    setGuidedRequired(Boolean(c.guidedRequired));
    setStartSeconds(c.startSeconds != null ? String(c.startSeconds) : "");
    setEndSeconds(c.endSeconds != null ? String(c.endSeconds) : "");
    setComparisonPrompt(c.comparisonPrompt ?? "");
    setComparisonOptions(c.comparisonOptions ?? []);
    setChecklist(done.checklist ?? []);
    setContinueLabel(done.continueLabel ?? "");
    setCautionEnabled(Boolean(c.cautionEnabled));
    setCautionTitle(c.cautionTitle ?? "容易失敗");
    setCautionItemsText((c.cautionItems ?? []).join("\n"));
  }, [page]);

  const saveBasics = () => {
    onSavePage({
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      body: body.trim() || null,
      eyebrow: eyebrow.trim() || null,
      page_type: pageType,
      layout_type: layoutType,
      alignment,
      ai_context: aiContext.trim() || null,
      step_id: stepId || null,
      active,
    });
  };

  const saveContentExtras = async () => {
    await onUpdateContent({
      splitDirection,
      timerSeconds: timerSeconds ? Number(timerSeconds) : undefined,
      timerLabel: timerLabel.trim() || undefined,
      ctaPrimary: ctaPrimary.trim() || undefined,
      ctaSecondary: ctaSecondary.trim() || undefined,
      guidedRequired,
      startSeconds: startSeconds ? Number(startSeconds) : undefined,
      endSeconds: endSeconds ? Number(endSeconds) : undefined,
      comparisonPrompt: comparisonPrompt.trim() || undefined,
      comparisonOptions,
      cautionEnabled,
      cautionTitle: cautionTitle.trim() || undefined,
      cautionItems: cautionItemsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    await onUpdateCompletion({
      checklist,
      continueLabel: continueLabel.trim() || undefined,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">編輯頁面</p>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={busy} onClick={onDuplicate}>
            複製
          </Button>
          <Button size="sm" variant="outline" className="text-red-600" disabled={busy} onClick={onDelete}>
            刪除
          </Button>
        </div>
      </div>

      <Field label="頁面類型">
        <select
          className="input-field"
          value={pageType}
          onChange={(e) => {
            const next = e.target.value as RecipeStoryPageType;
            setPageType(next);
            const defaults = defaultsForStoryIntent(
              next === "step_video" || next === "full_video"
                ? "video"
                : next === "image_text"
                  ? "image_text"
                  : next === "full_image"
                    ? "full_image"
                    : next
            );
            if (defaults.page_type === next) setLayoutType(defaults.layout_type);
          }}
        >
          {PAGE_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {STORY_PAGE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="版面 layout">
        <select
          className="input-field"
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value)}
        >
          {LAYOUT_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {STORY_LAYOUT_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="對齊 alignment">
        <select
          className="input-field"
          value={alignment}
          onChange={(e) => setAlignment(e.target.value)}
        >
          {ALIGNMENT_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="標題">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="副標">
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </Field>
      <Field label="眉標 eyebrow">
        <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
      </Field>
      <Field label="內文 body">
        <textarea
          className="input-field min-h-[88px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>
      <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={cautionEnabled}
            onChange={(e) => setCautionEnabled(e.target.checked)}
          />
          Popup：容易失敗／注意事項
        </label>
        {cautionEnabled ? (
          <>
            <Field label="Popup 標題">
              <Input value={cautionTitle} onChange={(e) => setCautionTitle(e.target.value)} />
            </Field>
            <Field label="注意事項（一行一點）">
              <textarea
                className="input-field min-h-[72px]"
                value={cautionItemsText}
                onChange={(e) => setCautionItemsText(e.target.value)}
                placeholder={"奶油不要融化\n不要攪拌過久"}
              />
            </Field>
          </>
        ) : null}
      </div>
      <Field label="提問脈絡（選填）">
        <textarea
          className="input-field min-h-[64px]"
          value={aiContext}
          onChange={(e) => setAiContext(e.target.value)}
          placeholder="學生提問時給老師的頁面脈絡"
        />
      </Field>
      <Field label="關聯步驟">
        <select className="input-field" value={stepId} onChange={(e) => setStepId(e.target.value)}>
          <option value="">（無）</option>
          {steps.map((s, i) => (
            <option key={s.id} value={s.id}>
              {i + 1}. {s.title || s.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        啟用
      </label>
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          saveBasics();
          await saveContentExtras();
        }}
      >
        儲存此頁
      </Button>

      <hr className="border-dashed" />
      <p className="text-sm font-medium">進階設定</p>

      <Field label="圖文方向">
        <select
          className="input-field"
          value={splitDirection}
          onChange={(e) => setSplitDirection(e.target.value as StorySplitDirection)}
        >
          {SPLIT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="timerSeconds">
          <Input
            type="number"
            value={timerSeconds}
            onChange={(e) => setTimerSeconds(e.target.value)}
          />
        </Field>
        <Field label="timerLabel">
          <Input value={timerLabel} onChange={(e) => setTimerLabel(e.target.value)} />
        </Field>
        <Field label="startSeconds">
          <Input
            type="number"
            value={startSeconds}
            onChange={(e) => setStartSeconds(e.target.value)}
          />
        </Field>
        <Field label="endSeconds">
          <Input type="number" value={endSeconds} onChange={(e) => setEndSeconds(e.target.value)} />
        </Field>
      </div>

      <Field label="CTA 主按鈕">
        <Input value={ctaPrimary} onChange={(e) => setCtaPrimary(e.target.value)} />
      </Field>
      <Field label="CTA 次按鈕">
        <Input value={ctaSecondary} onChange={(e) => setCtaSecondary(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={guidedRequired}
          onChange={(e) => setGuidedRequired(e.target.checked)}
        />
        guidedRequired（必須完成才可繼續）
      </label>

      <Field label="比較提示 comparisonPrompt">
        <Input value={comparisonPrompt} onChange={(e) => setComparisonPrompt(e.target.value)} />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">comparisonOptions</p>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() =>
              setComparisonOptions([
                ...comparisonOptions,
                { id: newLocalId("opt"), label: `選項 ${comparisonOptions.length + 1}` },
              ])
            }
          >
            新增選項
          </Button>
        </div>
        {comparisonOptions.map((opt, idx) => (
          <div key={opt.id} className="space-y-1 rounded-md border p-2">
            <Input
              placeholder="標籤"
              value={opt.label}
              onChange={(e) => {
                const next = [...comparisonOptions];
                next[idx] = { ...opt, label: e.target.value };
                setComparisonOptions(next);
              }}
            />
            <Input
              placeholder="說明 caption"
              value={opt.caption ?? ""}
              onChange={(e) => {
                const next = [...comparisonOptions];
                next[idx] = { ...opt, caption: e.target.value };
                setComparisonOptions(next);
              }}
            />
            <Input
              placeholder="圖片 URL"
              value={opt.imageUrl ?? ""}
              onChange={(e) => {
                const next = [...comparisonOptions];
                next[idx] = { ...opt, imageUrl: e.target.value };
                setComparisonOptions(next);
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              type="button"
              onClick={() => setComparisonOptions(comparisonOptions.filter((_, i) => i !== idx))}
            >
              移除
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">checklist（completion_config）</p>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() =>
              setChecklist([
                ...checklist,
                { id: newLocalId("chk"), text: `檢查 ${checklist.length + 1}` },
              ])
            }
          >
            新增項目
          </Button>
        </div>
        {checklist.map((item, idx) => (
          <div key={item.id} className="flex gap-1">
            <Input
              value={item.text}
              onChange={(e) => {
                const next = [...checklist];
                next[idx] = { ...item, text: e.target.value };
                setChecklist(next);
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              type="button"
              onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
            >
              ×
            </Button>
          </div>
        ))}
        <Field label="continueLabel">
          <Input value={continueLabel} onChange={(e) => setContinueLabel(e.target.value)} />
        </Field>
      </div>

      <Button
        size="sm"
        disabled={busy}
        onClick={() => {
          void saveContentExtras();
        }}
      >
        儲存設定欄位
      </Button>

      <hr className="border-dashed" />
      <p className="text-sm font-medium">頁面媒體</p>

      <div className="space-y-2">
        {pageMedia.length === 0 && (
          <p className="text-sm text-muted-foreground">尚無媒體</p>
        )}
        {pageMedia.map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded-md border p-2">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
              {m.thumbnail_url || m.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.thumbnail_url || m.url || ""}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
                  {m.media_type}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs">{m.media_type}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {m.original_filename || m.url || "（待上傳）"}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              disabled={busy}
              onClick={() => onDeleteMedia(m.id)}
            >
              刪
            </Button>
          </div>
        ))}
      </div>

      <AdminRecipeVideoUpload
        recipeId={recipeId}
        mediaScope="story_page"
        storyPageId={page.id}
        target="story_page_media"
        sortOrder={pageMedia.length}
        label="上傳 Story 影片"
        hint="直接上傳 MP4／WebM／MOV，不支援 YouTube。"
        onUploaded={() => onVideoUploaded()}
      />

      <div className="space-y-2 rounded-md border border-dashed p-2">
        <p className="text-[11px] text-muted-foreground">圖片／關鍵影格（可用 URL 或上傳）</p>
        <div className="grid grid-cols-[1fr_auto] gap-1">
          <Input
            placeholder="圖片 URL"
            value={mediaUrlDraft}
            onChange={(e) => onMediaUrlDraft(e.target.value)}
          />
          <select
            className="input-field"
            value={mediaTypeDraft === "video" ? "image" : mediaTypeDraft}
            onChange={(e) =>
              onMediaTypeDraft(e.target.value as "image" | "keyframe")
            }
          >
            <option value="image">image</option>
            <option value="keyframe">keyframe</option>
          </select>
        </div>
        <Button size="sm" variant="outline" disabled={busy || !mediaUrlDraft.trim()} onClick={onAddMediaUrl}>
          以圖片 URL 新增
        </Button>
        <div>
          <input
            ref={uploadRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadFile(file);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => uploadRef.current?.click()}
          >
            上傳圖片
          </Button>
        </div>
        <Field label="從既有食譜媒體選擇（圖片）">
          <div className="flex gap-1">
            <select
              className="input-field"
              value={pickRecipeMedia}
              onChange={(e) => onPickRecipeMedia(e.target.value)}
            >
              <option value="">選擇…</option>
              {recipeMedia
                .filter((m) => m.url && m.media_type !== "video")
                .map((m) => (
                  <option key={m.id ?? m.url} value={m.id ?? m.url}>
                    [{m.media_type}] {m.alt_text || m.url.slice(0, 48)}
                  </option>
                ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !pickRecipeMedia}
              onClick={onAddFromRecipeMedia}
            >
              加入
            </Button>
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
