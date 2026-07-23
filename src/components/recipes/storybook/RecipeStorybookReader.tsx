"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Menu,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  StoryPageView,
  type FlatStoryPage,
} from "@/components/recipes/storybook/StoryPageView";
import { StoryAskTeacherSheet } from "@/components/recipes/storybook/StoryAskTeacherSheet";
import type { StoryTimerState } from "@/components/recipes/storybook/layouts/TimerLayout";
import {
  isGuidedGatePage,
  parseContentConfig,
} from "@/components/recipes/storybook/story-media";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import type { RecipePlaybackContext } from "@/lib/recipes/media";
import {
  parseReaderSettings,
  type RecipeReaderSettings,
} from "@/lib/recipes/reader-settings";
import {
  flattenStoryPages,
  type StorybookPayload,
} from "@/lib/recipes/storybook";
import {
  loadStoryProgress,
  saveStoryProgress,
} from "@/lib/recipes/story-progress";
import type { StoryComparisonOption } from "@/lib/recipes/story-types";
import { cn } from "@/lib/utils";

type RecipeStorybookReaderProps = {
  data: SmartRecipePayload;
  stories: StorybookPayload;
  immersive?: boolean;
};

type ReaderPage = FlatStoryPage & { __synthetic?: "cover" | "toc" };

const SYNTH_COVER_ID = "__v3_cover__";
const SYNTH_TOC_ID = "__v3_toc__";

function buildReaderPages(
  chapters: StorybookPayload["chapters"],
  recipeTitle: string,
  settings: RecipeReaderSettings
): ReaderPage[] {
  const raw = flattenStoryPages(chapters) as FlatStoryPage[];
  // Drop legacy scale / empty failure-only pages (caution is popup)
  const filtered = raw.filter((p) => {
    if (p.page_type === "scale") return false;
    if (p.active === false) return false;
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

export function RecipeStorybookReader({
  data,
  stories,
  immersive = true,
}: RecipeStorybookReaderProps) {
  const { recipe } = data;
  const settings = useMemo(
    () => parseReaderSettings(recipe.reader_settings),
    [recipe.reader_settings]
  );

  const pages = useMemo(
    () => buildReaderPages(stories.chapters, recipe.title, settings),
    [stories.chapters, recipe.title, settings]
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [guided, setGuided] = useState(false);
  const [completedPageIds, setCompletedPageIds] = useState<Set<string>>(new Set());
  const [haveIds, setHaveIds] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(true);
  const [progressReady, setProgressReady] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [cautionOpen, setCautionOpen] = useState(false);
  const [askCtx, setAskCtx] = useState<{
    storyPageId: string;
    chapterId?: string | null;
    stepId?: string | null;
    title?: string | null;
  } | null>(null);
  const [playbackCtx, setPlaybackCtx] = useState<RecipePlaybackContext | null>(null);
  const [comparisonByPage, setComparisonByPage] = useState<Record<string, string>>({});
  const [checkpointByPage, setCheckpointByPage] = useState<Record<string, Set<string>>>({});
  const [timer, setTimer] = useState<StoryTimerState | null>(null);
  const touchStartX = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const saved = loadStoryProgress(recipe.id);
    if (saved) {
      setPageIndex(Math.min(saved.pageIndex, Math.max(0, pages.length - 1)));
      setGuided(Boolean(saved.guided));
      setCompletedPageIds(new Set(saved.completedPageIds ?? []));
      setHaveIds(new Set(saved.haveIds ?? []));
      setMuted(saved.muted !== false);
    }
    setProgressReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id]);

  useEffect(() => {
    if (!progressReady) return;
    saveStoryProgress(recipe.id, {
      pageIndex,
      guided,
      completedPageIds: Array.from(completedPageIds),
      haveIds: Array.from(haveIds),
      multiplier: 1,
      muted,
      updatedAt: new Date().toISOString(),
    });
  }, [recipe.id, pageIndex, guided, completedPageIds, haveIds, muted, progressReady]);

  useEffect(() => {
    if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1));
  }, [pages.length, pageIndex]);

  // Lock body scroll when immersive
  useEffect(() => {
    if (!immersive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [immersive]);

  const page = pages[pageIndex] ?? null;
  const config = parseContentConfig(page ?? undefined);

  useEffect(() => {
    if (!page || (page.page_type !== "timer" && page.layout_type !== "timer")) return;
    const seconds =
      typeof config.timerSeconds === "number" && config.timerSeconds > 0
        ? config.timerSeconds
        : 60;
    setTimer((prev) => {
      if (prev?.pageId === page.id) return prev;
      return {
        pageId: page.id,
        remaining: seconds,
        running: false,
        initialSeconds: seconds,
        label: config.timerLabel,
      };
    });
  }, [page, config.timerSeconds, config.timerLabel]);

  useEffect(() => {
    if (!timer?.running) return;
    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (!prev || !prev.running) return prev;
        if (prev.remaining <= 1) return { ...prev, remaining: 0, running: false };
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer?.running, timer?.pageId]);

  useEffect(() => {
    setPlaybackCtx(null);
    setCautionOpen(false);
  }, [pageIndex]);

  useEffect(() => {
    if (!guided) {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      return;
    }
    const request = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* optional */
      }
    };
    void request();
    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [guided]);

  const markComplete = useCallback((pageId: string) => {
    setCompletedPageIds((prev) => {
      if (prev.has(pageId)) return prev;
      const next = new Set(prev);
      next.add(pageId);
      return next;
    });
  }, []);

  const canAdvance = useCallback(
    (fromIndex: number) => {
      if (!guided) return true;
      const p = pages[fromIndex];
      if (!p || p.__synthetic) return true;
      const cfg = parseContentConfig(p);
      if (!isGuidedGatePage(p, cfg)) return true;
      if (cfg.skipAllowed) return true;
      return completedPageIds.has(p.id);
    },
    [guided, pages, completedPageIds]
  );

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, next));
      if (clamped === pageIndex) return;
      if (clamped > pageIndex && !canAdvance(pageIndex)) return;
      setPageIndex(clamped);
    },
    [pages.length, pageIndex, canAdvance]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(pageIndex + 1);
      if (e.key === "ArrowLeft") go(pageIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageIndex, go]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) go(pageIndex + 1);
    else go(pageIndex - 1);
  };

  const toggleHave = (id: string) => {
    setHaveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stepIndexLabel = useMemo(() => {
    if (!page?.step_id) return null;
    const steps = [...(recipe.recipe_steps ?? [])].sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.step_number - b.step_number
    );
    const idx = steps.findIndex((s) => s.id === page.step_id);
    if (idx < 0) return null;
    return `步驟 ${idx + 1} / ${steps.length}`;
  }, [page, recipe.recipe_steps]);

  const linkedStep = useMemo(() => {
    if (!page?.step_id) return null;
    return (recipe.recipe_steps ?? []).find((s) => s.id === page.step_id) ?? null;
  }, [page, recipe.recipe_steps]);

  const cautionItems = useMemo(() => {
    const fromPage = Array.isArray(config.cautionItems)
      ? config.cautionItems.map(String).filter(Boolean)
      : [];
    if (fromPage.length) return fromPage;
    const fails = linkedStep?.common_failures;
    if (!Array.isArray(fails)) return [] as string[];
    return fails.map(String).filter(Boolean);
  }, [config.cautionItems, linkedStep]);

  const showCaution =
    settings.showCautionPopup &&
    cautionItems.length > 0 &&
    (config.cautionEnabled !== false || Boolean(linkedStep?.common_failures?.length));

  const tocEntries = useMemo(() => {
    return pages
      .map((p, i) => ({
        index: i,
        id: p.id,
        title:
          p.page_type === "cover"
            ? "封面"
            : p.page_type === "toc"
              ? "目錄"
              : p.title || p.chapter?.title || p.page_type,
        current: i === pageIndex,
      }))
      .filter((e) => e.id !== SYNTH_COVER_ID || e.index === 0);
  }, [pages, pageIndex]);

  const isCover = page?.page_type === "cover";
  const isToc = page?.page_type === "toc";
  const blockedNext = guided && !canAdvance(pageIndex);
  const ctaPrimary =
    config.ctaPrimary || (isCover ? "開始閱讀" : isToc ? "開始" : "下一頁");
  const ctaSecondary = config.ctaSecondary || "上一頁";

  const shellClass = immersive
    ? "fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#1a100c]"
    : "relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col overflow-x-hidden bg-[#1a100c]";

  return (
    <div
      className={shellClass}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="absolute inset-x-0 top-0 z-30 flex items-center gap-1 bg-gradient-to-b from-black/55 to-transparent px-2 pb-10 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href="/recipes"
          className="inline-flex h-10 items-center gap-0.5 rounded-xl px-2 text-sm font-medium text-white/95"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </Link>
        <div className="min-w-0 flex-1 text-center">
          {!isCover ? (
            <>
              <p className="truncate text-sm font-bold text-white">
                {page?.chapter?.title || recipe.title}
              </p>
              <p className="text-[11px] text-white/70">
                {stepIndexLabel || `${pageIndex + 1} / ${pages.length}`}
              </p>
            </>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "開啟聲音" : "靜音"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        {settings.showToc ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
            onClick={() => setTocOpen(true)}
            aria-label="目錄"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      <main className="relative flex-1 overflow-x-hidden overflow-y-auto">
        {isCover ? (
          <CoverPage
            title={recipe.title}
            coverImage={recipe.cover_image}
            onStart={() => go(Math.min(pageIndex + 1, pages.length - 1))}
          />
        ) : isToc ? (
          <TocPage
            entries={tocEntries.filter((e) => e.id !== SYNTH_TOC_ID && e.id !== SYNTH_COVER_ID)}
            onJump={(i) => {
              setPageIndex(i);
            }}
          />
        ) : page ? (
          <StoryPageView
            page={page}
            pageActive
            data={data}
            multiplier={1}
            onMultiplierChange={() => {}}
            haveIds={haveIds}
            onToggleHave={toggleHave}
            muted={muted}
            guided={guided}
            completedPageIds={completedPageIds}
            onMarkComplete={markComplete}
            comparisonChoice={comparisonByPage[page.id] ?? null}
            onComparisonChoice={(pageId, option: StoryComparisonOption) => {
              setComparisonByPage((prev) => ({ ...prev, [pageId]: option.id }));
            }}
            checkpointChecked={checkpointByPage[page.id] ?? new Set()}
            onCheckpointToggle={(itemId) => {
              setCheckpointByPage((prev) => {
                const cur = new Set(prev[page.id] ?? []);
                if (cur.has(itemId)) cur.delete(itemId);
                else cur.add(itemId);
                return { ...prev, [page.id]: cur };
              });
            }}
            timerRemaining={
              timer?.pageId === page.id ? timer.remaining : config.timerSeconds ?? 60
            }
            timerRunning={timer?.pageId === page.id ? timer.running : false}
            timerInitial={
              timer?.pageId === page.id
                ? timer.initialSeconds
                : config.timerSeconds ?? 60
            }
            timerLabel={timer?.label || config.timerLabel}
            onTimerToggle={() => {
              setTimer((prev) => {
                if (!prev || prev.pageId !== page.id) {
                  const seconds = config.timerSeconds ?? 60;
                  return {
                    pageId: page.id,
                    remaining: seconds,
                    running: true,
                    initialSeconds: seconds,
                    label: config.timerLabel,
                  };
                }
                return { ...prev, running: !prev.running };
              });
            }}
            onTimerReset={() => {
              setTimer((prev) => {
                if (!prev || prev.pageId !== page.id) return prev;
                return { ...prev, remaining: prev.initialSeconds, running: false };
              });
            }}
            onAskAi={(ctx) => {
              if (!settings.showAskTeacher) return;
              setAskCtx({
                storyPageId: ctx.storyPageId,
                chapterId: ctx.chapterId,
                stepId: ctx.stepId,
                title: ctx.title,
              });
            }}
            onPlaybackContext={setPlaybackCtx}
            onStartFree={() => {
              setGuided(false);
              go(Math.min(pageIndex + 1, pages.length - 1));
            }}
            onStartGuided={() => {
              setGuided(true);
              go(Math.min(pageIndex + 1, pages.length - 1));
            }}
            stepIndexLabel={stepIndexLabel}
            hideScaling
            readerSettings={settings}
          />
        ) : null}
      </main>

      {!isCover ? (
        <footer
          className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pt-12"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            {settings.showCautionPopup && showCaution ? (
              <button
                type="button"
                onClick={() => setCautionOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                注意事項
              </button>
            ) : null}
            {settings.showAskTeacher && page && !page.__synthetic ? (
              <button
                type="button"
                onClick={() =>
                  setAskCtx({
                    storyPageId: page.id,
                    chapterId: page.chapter_id,
                    stepId: page.step_id,
                    title: page.title || stepIndexLabel,
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                我要提問
              </button>
            ) : null}
          </div>
          {blockedNext ? (
            <p className="mb-2 text-center text-xs text-white/80">
              請完成此頁檢查後再繼續
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={pageIndex <= 0}
              onClick={() => go(pageIndex - 1)}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-1 rounded-2xl border border-white/30 bg-white/15 text-sm font-bold text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
              {ctaSecondary}
            </button>
            <button
              type="button"
              disabled={pageIndex >= pages.length - 1 || blockedNext}
              onClick={() => {
                if (page && config.skipAllowed) markComplete(page.id);
                go(pageIndex + 1);
              }}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-1 rounded-2xl bg-[#FF5A5F] text-sm font-bold text-white disabled:opacity-40"
            >
              {ctaPrimary}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </footer>
      ) : null}

      {/* Collapsible TOC */}
      {tocOpen ? (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/50">
          <button
            type="button"
            className="flex-1"
            aria-label="關閉目錄"
            onClick={() => setTocOpen(false)}
          />
          <aside className="flex h-full w-[min(100%,320px)] flex-col bg-[#FFF9EA] text-[#3D2914] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F2D8BF] px-4 py-3">
              <p className="font-bold">目錄</p>
              <button type="button" onClick={() => setTocOpen(false)} aria-label="關閉">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2">
              {tocEntries.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPageIndex(e.index);
                      setTocOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm",
                      e.current
                        ? "bg-[#FF5A5F] font-bold text-white"
                        : "text-[#6B3F24] hover:bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        e.current ? "bg-white" : "border border-[#C4A484]"
                      )}
                    />
                    <span className="truncate">{e.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}

      {/* Caution popup */}
      {cautionOpen ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 text-[#3D2914] sm:rounded-3xl">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="font-bold">{config.cautionTitle || "容易失敗"}</p>
            </div>
            <ul className="space-y-2">
              {cautionItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <span className="text-[#FF5A5F]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setCautionOpen(false)}
              className="mt-5 min-h-11 w-full rounded-2xl bg-[#FF5A5F] text-sm font-bold text-white"
            >
              知道了
            </button>
          </div>
        </div>
      ) : null}

      {askCtx && settings.showAskTeacher ? (
        <StoryAskTeacherSheet
          open
          onClose={() => setAskCtx(null)}
          recipe={recipe}
          context={askCtx}
        />
      ) : null}

      {/* silence unused playback for now */}
      {playbackCtx ? null : null}
    </div>
  );
}

function CoverPage({
  title,
  coverImage,
  onStart,
}: {
  title: string;
  coverImage: string | null;
  onStart: () => void;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col justify-end">
      {coverImage ? (
        <Image
          src={coverImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D2914] to-[#1a100c]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />
      <div className="relative z-10 space-y-4 px-6 pb-28 pt-24 text-center text-white">
        <p className="text-xs font-semibold tracking-[0.2em] text-white/70">
          CHIMEIDIY
        </p>
        <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
          {title}
        </h1>
        <button
          type="button"
          onClick={onStart}
          className="mx-auto mt-4 inline-flex min-h-12 min-w-[200px] items-center justify-center rounded-2xl bg-[#FF5A5F] px-8 text-sm font-bold text-white"
        >
          開始閱讀 →
        </button>
      </div>
    </div>
  );
}

function TocPage({
  entries,
  onJump,
}: {
  entries: Array<{ index: number; id: string; title: string }>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#FFF9EA] px-6 pb-32 pt-24 text-[#3D2914]">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#FF5A5F]">
        RECIPE CONTENTS
      </p>
      <h2 className="mt-2 font-serif text-3xl font-bold">食譜目錄</h2>
      <ol className="mt-8 space-y-1">
        {entries.map((e, i) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onJump(e.index)}
              className="flex w-full items-baseline gap-3 border-b border-[#F2D8BF] py-3.5 text-left hover:text-[#FF5A5F]"
            >
              <span className="w-8 shrink-0 font-mono text-sm text-[#C4A484]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-base font-medium">{e.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
