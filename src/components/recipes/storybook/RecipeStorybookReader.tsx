"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  List,
  MoreHorizontal,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  StoryPageView,
  type FlatStoryPage,
} from "@/components/recipes/storybook/StoryPageView";
import {
  StoryPageAiSheet,
  type StoryAiContext,
} from "@/components/recipes/storybook/StoryPageAiSheet";
import type { StoryTimerState } from "@/components/recipes/storybook/layouts/TimerLayout";
import {
  isGuidedGatePage,
  parseContentConfig,
} from "@/components/recipes/storybook/story-media";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import type { RecipePlaybackContext } from "@/lib/recipes/media";
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
};

export function RecipeStorybookReader({ data, stories }: RecipeStorybookReaderProps) {
  const { recipe } = data;
  const pages = useMemo(
    () => flattenStoryPages(stories.chapters) as FlatStoryPage[],
    [stories.chapters]
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [guided, setGuided] = useState(false);
  const [completedPageIds, setCompletedPageIds] = useState<Set<string>>(new Set());
  const [haveIds, setHaveIds] = useState<Set<string>>(new Set());
  const [multiplier, setMultiplier] = useState(1);
  const [muted, setMuted] = useState(true);
  const [progressReady, setProgressReady] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [aiCtx, setAiCtx] = useState<StoryAiContext | null>(null);
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
      setMultiplier(saved.multiplier || 1);
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
      multiplier,
      muted,
      updatedAt: new Date().toISOString(),
    });
  }, [
    recipe.id,
    pageIndex,
    guided,
    completedPageIds,
    haveIds,
    multiplier,
    muted,
    progressReady,
  ]);

  useEffect(() => {
    if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1));
  }, [pages.length, pageIndex]);

  const page = pages[pageIndex] ?? null;
  const config = parseContentConfig(page ?? undefined);

  // Init / sync timer for timer pages
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

  // Persistent countdown
  useEffect(() => {
    if (!timer?.running) return;
    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (!prev || !prev.running) return prev;
        if (prev.remaining <= 1) {
          return { ...prev, remaining: 0, running: false };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer?.running, timer?.pageId]);

  useEffect(() => {
    setPlaybackCtx(null);
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
      if (!p) return true;
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

  const chapterTitle = page?.chapter?.title || recipe.title;
  const blockedNext = guided && !canAdvance(pageIndex);
  const ctaPrimary = config.ctaPrimary || "繼續";
  const ctaSecondary = config.ctaSecondary || "上一頁";
  const isCover = page?.page_type === "cover";

  const tocChapters = useMemo(() => {
    return stories.chapters
      .filter((c) => c.active !== false)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((ch) => {
        const chPages = [...(ch.recipe_story_pages ?? [])]
          .filter((p) => p.active !== false)
          .sort((a, b) => a.sort_order - b.sort_order);
        return { chapter: ch, pages: chPages };
      });
  }, [stories.chapters]);

  const findPageIndex = (id: string) => pages.findIndex((p) => p.id === id);

  return (
    <div
      className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col overflow-x-hidden bg-[#1a100c]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="absolute inset-x-0 top-0 z-30 flex items-center gap-1 bg-gradient-to-b from-black/55 to-transparent px-2 pb-8 pt-2">
        <Link
          href="/recipes"
          className="inline-flex h-10 items-center gap-0.5 rounded-xl px-2 text-sm font-medium text-white/95"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold text-white">{chapterTitle}</p>
          {stepIndexLabel ? (
            <p className="text-[11px] text-white/70">{stepIndexLabel}</p>
          ) : (
            <p className="text-[11px] text-white/70">
              {pageIndex + 1} / {pages.length}
            </p>
          )}
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "開啟聲音" : "靜音"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
          onClick={() => setTocOpen(true)}
          aria-label="目錄"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
          onClick={() => setMoreOpen((v) => !v)}
          aria-label="更多"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      {moreOpen ? (
        <div className="absolute right-2 top-12 z-40 w-48 overflow-hidden rounded-2xl bg-white shadow-xl">
          {guided ? (
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm text-[#6B3F24] hover:bg-[#FFF9EA]"
              onClick={() => {
                setGuided(false);
                setMoreOpen(false);
              }}
            >
              切換自由瀏覽
            </button>
          ) : (
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm text-[#6B3F24] hover:bg-[#FFF9EA]"
              onClick={() => {
                setGuided(true);
                setMoreOpen(false);
              }}
            >
              開始跟做模式
            </button>
          )}
          {guided ? (
            <button
              type="button"
              className="block w-full border-t border-[#F2D8BF] px-4 py-3 text-left text-sm text-[#6B3F24] hover:bg-[#FFF9EA]"
              onClick={() => {
                if (confirm("結束跟做模式？進度已自動儲存。")) {
                  setGuided(false);
                  setMoreOpen(false);
                }
              }}
            >
              結束跟做
            </button>
          ) : null}
        </div>
      ) : null}

      <main className="relative flex-1 overflow-x-hidden overflow-y-auto">
        {page ? (
          <StoryPageView
            page={page}
            pageActive
            data={data}
            multiplier={multiplier}
            onMultiplierChange={setMultiplier}
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
            onAskAi={setAiCtx}
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
          />
        ) : null}
      </main>

      {!isCover ? (
        <footer
          className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pt-10"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {blockedNext ? (
            <p className="mb-2 text-center text-xs text-white/80">
              請完成此頁檢查／選擇後再繼續
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
                if (config.skipAllowed) markComplete(page!.id);
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

      {aiCtx ? (
        <StoryPageAiSheet
          open
          onClose={() => setAiCtx(null)}
          recipe={recipe}
          context={aiCtx}
          multiplier={multiplier}
          ingredients={recipe.recipe_ingredients ?? []}
          tools={data.tools}
          playbackCtx={playbackCtx}
        />
      ) : null}

      {tocOpen ? (
        <div className="fixed inset-0 z-40 bg-black/45" onClick={() => setTocOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-[#FFF9EA] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-[#6B3F24]">目錄</h2>
              <button type="button" onClick={() => setTocOpen(false)} aria-label="關閉">
                <X className="h-5 w-5 text-[#6B3F24]" />
              </button>
            </div>
            <div className="space-y-4">
              {tocChapters.map(({ chapter, pages: chPages }) => (
                <div key={chapter.id}>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#FF5A5F]">
                    {chapter.chapter_number != null
                      ? `第 ${chapter.chapter_number} 章 · `
                      : ""}
                    {chapter.title}
                  </p>
                  <ul className="space-y-0.5">
                    {chPages.map((p) => {
                      const idx = findPageIndex(p.id);
                      const isCurrent = idx === pageIndex;
                      const done = completedPageIds.has(p.id);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm",
                              isCurrent
                                ? "bg-white font-bold text-[#FF5A5F]"
                                : "text-[#6B3F24]"
                            )}
                            onClick={() => {
                              if (idx >= 0) {
                                if (idx > pageIndex && !canAdvance(pageIndex)) return;
                                setPageIndex(idx);
                              }
                              setTocOpen(false);
                            }}
                          >
                            <span className="w-4 shrink-0 text-center text-xs">
                              {done ? "✓" : isCurrent ? "●" : "○"}
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {p.title || p.page_type}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
