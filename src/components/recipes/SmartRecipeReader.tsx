"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  Share2,
  X,
} from "lucide-react";
import { CookTimer } from "@/components/recipes/CookTimer";
import { IngredientChecklist } from "@/components/recipes/IngredientChecklist";
import { MissingIngredientsCartButton } from "@/components/recipes/MissingIngredientsCartButton";
import {
  RecipeKeyframeStrip,
  RecipeMediaPlayer,
} from "@/components/recipes/RecipeMediaPlayer";
import { RecipeDiscussionPanel } from "@/components/recipes/RecipeDiscussionPanel";
import { RecipeRecommendationsPanel } from "@/components/recipes/RecipeRecommendations";
import { RecipeStepAiSheet } from "@/components/recipes/RecipeStepAiSheet";
import { RecipeStepList } from "@/components/recipes/RecipeStepList";
import { RecipeSubmissionsPanel } from "@/components/recipes/RecipeSubmissionsPanel";
import { VideoEmbed } from "@/components/videos/VideoEmbed";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import type { RecipeStep } from "@/lib/types/database";
import {
  buildFlipPages,
  difficultyLabel,
  type FlipPage,
  type FlipPageKind,
  type SmartRecipePayload,
} from "@/lib/recipes/flip-pages";
import {
  getRecipeLevelMedia,
  getStepMedia,
  pickKeyframes,
  pickPrimaryVideo,
  type RecipePlaybackContext,
} from "@/lib/recipes/media";
import { loadRecipeProgress, saveRecipeProgress } from "@/lib/recipes/progress";
import { scaleAmountText } from "@/lib/recipes/scaling";
import { cn, formatDate } from "@/lib/utils";

type SmartRecipeReaderProps = {
  data: SmartRecipePayload;
  /** Kindle-like fullscreen when opened from immersive route */
  immersive?: boolean;
  /** Initial flip/full from ?view= */
  initialMode?: "flip" | "full";
};

export function SmartRecipeReader({
  data,
  immersive = false,
  initialMode,
}: SmartRecipeReaderProps) {
  const { recipe } = data;
  const flipEnabled = recipe.flip_mode_enabled !== false;
  const fullEnabled = recipe.full_reading_enabled !== false;
  const defaultMode =
    initialMode === "full" && fullEnabled
      ? "full"
      : initialMode === "flip" && flipEnabled
        ? "flip"
        : recipe.reading_mode_default === "full" && fullEnabled
          ? "full"
          : flipEnabled
            ? "flip"
            : "full";

  const pages = useMemo(() => buildFlipPages(data), [data]);
  const [readingMode, setReadingMode] = useState<"flip" | "full">(defaultMode);
  const [pageIndex, setPageIndex] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [haveIds, setHaveIds] = useState<Set<string>>(new Set());
  const [cookMode, setCookMode] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [playbackCtx, setPlaybackCtx] = useState<RecipePlaybackContext | null>(null);
  const [aiStep, setAiStep] = useState<RecipeStep | null>(null);
  const [submissionsOpenForm, setSubmissionsOpenForm] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const saved = loadRecipeProgress(recipe.id);
    if (saved) {
      setPageIndex(Math.min(saved.pageIndex, Math.max(0, pages.length - 1)));
      setMultiplier(saved.multiplier || 1);
      setHaveIds(new Set(saved.haveIds ?? []));
      setCookMode(Boolean(saved.cookMode));
      if (saved.readingMode === "full" && fullEnabled) setReadingMode("full");
      else if (flipEnabled) setReadingMode("flip");
    }
    setProgressReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id]);

  useEffect(() => {
    if (!progressReady) return;
    saveRecipeProgress(recipe.id, {
      pageIndex,
      multiplier,
      haveIds: Array.from(haveIds),
      cookMode,
      readingMode,
      updatedAt: new Date().toISOString(),
    });
  }, [recipe.id, pageIndex, multiplier, haveIds, cookMode, readingMode, progressReady]);

  useEffect(() => {
    if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1));
  }, [pages.length, pageIndex]);

  const go = useCallback(
    (next: number) => {
      setPageIndex(Math.max(0, Math.min(pages.length - 1, next)));
    },
    [pages.length]
  );

  const goToKind = useCallback(
    (kind: FlipPageKind, options?: { openSubmissionsForm?: boolean }) => {
      const idx = pages.findIndex((p) => p.kind === kind);
      if (idx < 0) return;
      if (kind === "submissions") {
        setSubmissionsOpenForm(Boolean(options?.openSubmissionsForm));
      }
      go(idx);
    },
    [pages, go]
  );

  useEffect(() => {
    const kind = pages[pageIndex]?.kind;
    if (kind !== "submissions") setSubmissionsOpenForm(false);
  }, [pageIndex, pages]);

  useEffect(() => {
    if (readingMode !== "flip") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(pageIndex + 1);
      if (e.key === "ArrowLeft") go(pageIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readingMode, pageIndex, go]);

  useEffect(() => {
    if (!cookMode) {
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
        /* Wake Lock optional */
      }
    };
    request();
    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [cookMode]);

  useEffect(() => {
    if (!cookMode) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [cookMode]);

  useEffect(() => {
    setPlaybackCtx(null);
  }, [pageIndex]);

  const toggleHave = (id: string) => {
    setHaveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const page = pages[pageIndex];
  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/recipes/${recipe.slug}`;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || readingMode !== "flip") return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) go(pageIndex + 1);
    else go(pageIndex - 1);
  };

  useEffect(() => {
    if (!immersive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [immersive]);

  if (readingMode === "full") {
    return (
      <div
        className={cn(
          "mx-auto max-w-3xl space-y-6 pb-8",
          immersive && "fixed inset-0 z-[100] overflow-y-auto bg-[#FFF9EA] px-4 pt-4"
        )}
      >
        <ReaderModeBar
          recipeTitle={recipe.title}
          readingMode={readingMode}
          flipEnabled={flipEnabled}
          fullEnabled={fullEnabled}
          onModeChange={setReadingMode}
          onShare={shareUrl}
          recipeId={recipe.id}
        />
        <FullReadingView
          data={data}
          multiplier={multiplier}
          onMultiplierChange={setMultiplier}
          haveIds={haveIds}
          onToggleHave={toggleHave}
          onAskStep={setAiStep}
          onStartCook={() => {
            setReadingMode("flip");
            setCookMode(true);
            const firstStep = pages.findIndex((p) => p.kind === "step");
            go(firstStep >= 0 ? firstStep : 0);
          }}
        />
        {aiStep ? (
          <RecipeStepAiSheet
            open
            onClose={() => setAiStep(null)}
            recipe={recipe}
            step={aiStep}
            multiplier={multiplier}
            ingredients={recipe.recipe_ingredients ?? []}
            tools={data.tools}
            playbackCtx={playbackCtx}
            previousStepSummary={previousStepSummary(recipe.recipe_steps ?? [], aiStep)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex max-w-3xl flex-col",
        cookMode ? "min-h-[100dvh]" : "min-h-[70vh]",
        immersive && "fixed inset-0 z-[100] max-w-none overflow-hidden bg-[#FFF9EA]"
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="sticky top-0 z-20 border-b border-[#F2D8BF] bg-[#FFF9EA]/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link
            href="/recipes"
            className="inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm font-medium text-[#6B3F24]"
          >
            <ChevronLeft className="h-4 w-4" />
            返回食譜
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-bold text-[#6B3F24]">{recipe.title}</p>
            <p className="text-[11px] text-foreground-secondary">
              第 {pageIndex + 1} / {pages.length} 頁
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#6B3F24]"
            onClick={() => setTocOpen(true)}
            aria-label="目錄"
          >
            <List className="h-5 w-5" />
          </button>
          <FavoriteButton targetType="recipe" targetId={recipe.id} className="!h-10 !w-10 !rounded-xl" />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[#FF5A5F] transition-all"
            style={{ width: `${((pageIndex + 1) / Math.max(1, pages.length)) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-full bg-white p-1">
            {flipEnabled ? (
              <ModeChip active onClick={() => setReadingMode("flip")}>
                翻頁閱讀
              </ModeChip>
            ) : null}
            {fullEnabled ? (
              <ModeChip active={false} onClick={() => setReadingMode("full")}>
                完整閱讀
              </ModeChip>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#F2D8BF] bg-white px-3 text-xs font-semibold text-[#6B3F24]"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: recipe.title, url: shareUrl }).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(shareUrl);
                  alert("已複製連結");
                }
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              分享
            </button>
            {cookMode ? (
              <button
                type="button"
                className="h-9 rounded-full border border-[#F2D8BF] bg-white px-3 text-xs font-semibold text-[#6B3F24]"
                onClick={() => {
                  if (confirm("確定離開製作模式？進度已自動儲存。")) setCookMode(false);
                }}
              >
                結束製作
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main
        className={cn(
          "flex-1 px-4 py-5",
          cookMode && "text-base leading-relaxed"
        )}
      >
        {page ? (
          <FlipPageView
            page={page}
            pageActive
            data={data}
            multiplier={multiplier}
            onMultiplierChange={setMultiplier}
            haveIds={haveIds}
            onToggleHave={toggleHave}
            cookMode={cookMode}
            playbackCtx={playbackCtx}
            onPlaybackContext={setPlaybackCtx}
            onAskStep={setAiStep}
            onStartCook={() => {
              setCookMode(true);
              const firstStep = pages.findIndex((p) => p.kind === "step");
              go(firstStep >= 0 ? firstStep : pageIndex);
            }}
            onGoToKind={goToKind}
            submissionsOpenForm={submissionsOpenForm}
          />
        ) : null}
      </main>

      <footer
        className="sticky bottom-0 z-20 border-t border-[#F2D8BF] bg-white/95 px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pageIndex <= 0}
            onClick={() => go(pageIndex - 1)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1 rounded-2xl border border-[#F2D8BF] font-bold text-[#6B3F24] disabled:opacity-40",
              cookMode ? "min-h-14 text-base" : "min-h-12 text-sm"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
            上一步
          </button>
          <button
            type="button"
            disabled={pageIndex >= pages.length - 1}
            onClick={() => go(pageIndex + 1)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1 rounded-2xl bg-[#FF5A5F] font-bold text-white disabled:opacity-40",
              cookMode ? "min-h-14 text-base" : "min-h-12 text-sm"
            )}
          >
            下一步
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </footer>

      {aiStep ? (
        <RecipeStepAiSheet
          open
          onClose={() => setAiStep(null)}
          recipe={recipe}
          step={aiStep}
          multiplier={multiplier}
          ingredients={recipe.recipe_ingredients ?? []}
          tools={data.tools}
          playbackCtx={playbackCtx}
          previousStepSummary={previousStepSummary(recipe.recipe_steps ?? [], aiStep)}
        />
      ) : null}

      {tocOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setTocOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-[#6B3F24]">目錄</h2>
              <button type="button" onClick={() => setTocOpen(false)} aria-label="關閉">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-1">
              {pages.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm",
                      i === pageIndex ? "bg-[#FFF9EA] font-bold text-[#FF5A5F]" : "text-[#6B3F24]"
                    )}
                    onClick={() => {
                      go(i);
                      setTocOpen(false);
                    }}
                  >
                    <span>{p.title}</span>
                    <span className="text-xs text-foreground-secondary">{i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? "bg-[#FF5A5F] text-white" : "text-[#6B3F24]"
      )}
    >
      {children}
    </button>
  );
}

function ReaderModeBar({
  recipeTitle,
  readingMode,
  flipEnabled,
  fullEnabled,
  onModeChange,
  onShare,
  recipeId,
}: {
  recipeTitle: string;
  readingMode: "flip" | "full";
  flipEnabled: boolean;
  fullEnabled: boolean;
  onModeChange: (m: "flip" | "full") => void;
  onShare: string;
  recipeId: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Link href="/recipes" className="text-sm font-medium text-[#6B3F24]">
        ← 返回食譜
      </Link>
      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-full bg-[#FFF9EA] p-1">
          {flipEnabled ? (
            <ModeChip active={readingMode === "flip"} onClick={() => onModeChange("flip")}>
              翻頁閱讀
            </ModeChip>
          ) : null}
          {fullEnabled ? (
            <ModeChip active={readingMode === "full"} onClick={() => onModeChange("full")}>
              完整閱讀
            </ModeChip>
          ) : null}
        </div>
        <FavoriteButton targetType="recipe" targetId={recipeId} className="!h-9 !w-9 !rounded-xl" />
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-full border border-[#F2D8BF] px-3 text-xs font-semibold"
          onClick={() => {
            if (navigator.share) navigator.share({ title: recipeTitle, url: onShare }).catch(() => {});
            else if (navigator.clipboard) {
              navigator.clipboard.writeText(onShare);
              alert("已複製連結");
            }
          }}
        >
          <Share2 className="h-3.5 w-3.5" />
          分享
        </button>
      </div>
    </div>
  );
}

function FlipPageView({
  page,
  pageActive,
  data,
  multiplier,
  onMultiplierChange,
  haveIds,
  onToggleHave,
  cookMode,
  playbackCtx,
  onPlaybackContext,
  onAskStep,
  onStartCook,
  onGoToKind,
  submissionsOpenForm,
}: {
  page: FlipPage;
  pageActive: boolean;
  data: SmartRecipePayload;
  multiplier: number;
  onMultiplierChange: (n: number) => void;
  haveIds: Set<string>;
  onToggleHave: (id: string) => void;
  cookMode: boolean;
  playbackCtx: RecipePlaybackContext | null;
  onPlaybackContext: (ctx: RecipePlaybackContext) => void;
  onAskStep: (step: RecipeStep) => void;
  onStartCook: () => void;
  onGoToKind: (kind: FlipPageKind, options?: { openSubmissionsForm?: boolean }) => void;
  submissionsOpenForm: boolean;
}) {
  const { recipe, tools, preparations, faq, recommendations, related, media } = data;
  const ingredients = recipe.recipe_ingredients ?? [];
  const recipeVideos = getRecipeLevelMedia(media);
  const fullVideo = pickPrimaryVideo(recipeVideos);

  switch (page.kind) {
    case "cover":
      return (
        <section className="space-y-5 text-center">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-[24px] bg-[#FFF9EA]">
            {recipe.cover_image ? (
              <Image
                src={recipe.cover_image}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 448px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#6B3F24]/40">
                <BookOpen className="h-16 w-16" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-[#FF8A3D]">
              {recipe.recipe_categories?.name ?? "食譜"}
            </p>
            <h1 className={cn("mt-1 font-bold text-[#6B3F24]", cookMode ? "text-3xl" : "text-2xl")}>
              {recipe.title}
            </h1>
            {recipe.author_label ? (
              <p className="mt-1 text-sm text-foreground-secondary">{recipe.author_label}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="rounded-full bg-[#FFF9EA] px-3 py-1 text-[#6B3F24]">
              {difficultyLabel(recipe.difficulty)}
            </span>
            {recipe.total_time ? (
              <span className="rounded-full bg-[#FFF9EA] px-3 py-1 text-[#6B3F24]">
                約 {recipe.total_time} 分
              </span>
            ) : null}
            {recipe.servings ? (
              <span className="rounded-full bg-[#FFF9EA] px-3 py-1 text-[#6B3F24]">
                {recipe.servings}
              </span>
            ) : null}
          </div>
          {(recipe.tags ?? []).length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {recipe.tags!.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[#F2D8BF] px-2.5 py-0.5 text-[11px] text-[#6B3F24]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {fullVideo && pageActive ? (
            <div className="text-left">
              <p className="mb-2 text-sm font-bold text-[#6B3F24]">完整教學預覽</p>
              <RecipeMediaPlayer
                media={fullVideo}
                active={pageActive}
                showMarkers={false}
                onContextChange={onPlaybackContext}
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={onStartCook}
            className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-center rounded-2xl bg-[#FF5A5F] text-base font-bold text-white"
          >
            開始製作
          </button>
        </section>
      );

    case "intro":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#6B3F24]">成品介紹</h2>
          {recipe.summary ? (
            <p className="text-[#6B3F24]/90">{recipe.summary}</p>
          ) : null}
          {recipe.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {recipe.content}
            </p>
          ) : null}
        </section>
      );

    case "scale":
    case "ingredients":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#6B3F24]">
            {page.kind === "scale" ? "配方倍率與份量" : "材料"}
          </h2>
          <IngredientChecklist
            ingredients={ingredients}
            multiplier={multiplier}
            onMultiplierChange={onMultiplierChange}
            haveIds={haveIds}
            onToggleHave={onToggleHave}
            scalingEnabled={recipe.ingredient_scaling_enabled !== false}
            showScaleControls={page.kind === "scale" || page.kind === "ingredients"}
            cookMode={cookMode}
          />
        </section>
      );

    case "tools":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#6B3F24]">器具</h2>
          <ul className="divide-y divide-[#F2D8BF] overflow-hidden rounded-2xl border border-[#F2D8BF] bg-white">
            {tools.map((t) => (
              <li key={t.id} className="px-4 py-3 text-sm text-[#6B3F24]">
                <p className="font-semibold">{t.name}</p>
                {t.notes ? <p className="mt-1 text-xs text-foreground-secondary">{t.notes}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      );

    case "preparations":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#6B3F24]">前置作業</h2>
          <ol className="space-y-3">
            {preparations.map((p, i) => (
              <li key={p.id} className="rounded-2xl border border-[#F2D8BF] bg-white p-4">
                <p className="font-semibold text-[#6B3F24]">
                  {p.title || `準備 ${i + 1}`}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{p.content}</p>
              </li>
            ))}
          </ol>
        </section>
      );

    case "step": {
      const step = page.step!;
      const stepMedia = getStepMedia(media, step.id);
      const stepVideo = pickPrimaryVideo(stepMedia);
      const keyframes = pickKeyframes(stepMedia);
      const linkedOnly = ingredients.some((i) => (i.used_in_step_ids ?? []).length > 0);
      const displayIngs = linkedOnly
        ? ingredients.filter((ing) => (ing.used_in_step_ids ?? []).includes(step.id))
        : [];

      return (
        <section className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#FF8A3D]">
            Step {page.stepIndex} / {page.stepTotal}
          </p>
          <h2 className={cn("font-bold text-[#6B3F24]", cookMode ? "text-2xl" : "text-xl")}>
            {step.title || `步驟 ${step.step_number}`}
          </h2>
          {stepVideo ? (
            <RecipeMediaPlayer
              media={stepVideo}
              active={pageActive}
              onContextChange={onPlaybackContext}
            />
          ) : step.image_url ? (
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#FFF9EA]">
              <Image
                src={step.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          ) : null}
          {keyframes.length > 0 ? <RecipeKeyframeStrip items={keyframes} /> : null}
          <p
            className={cn(
              "whitespace-pre-wrap text-[#6B3F24]",
              cookMode ? "text-lg leading-relaxed" : "text-sm leading-relaxed"
            )}
          >
            {step.description}
          </p>
          {(step.temperature_value || step.duration_seconds || step.timer_enabled) && (
            <div className="flex flex-wrap gap-2 text-sm">
              {step.temperature_value != null ? (
                <span className="rounded-full bg-[#FFF9EA] px-3 py-1 font-semibold text-[#6B3F24]">
                  {step.temperature_value}
                  {step.temperature_unit === "F" ? "°F" : "°C"}
                </span>
              ) : null}
              {step.duration_seconds ? (
                <span className="rounded-full bg-[#FFF9EA] px-3 py-1 font-semibold text-[#6B3F24]">
                  {Math.round(step.duration_seconds / 60)} 分鐘
                </span>
              ) : null}
            </div>
          )}
          {step.timer_enabled && step.duration_seconds ? (
            <CookTimer initialSeconds={step.duration_seconds} large={cookMode} />
          ) : null}
          {displayIngs.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-bold text-[#6B3F24]">本步驟使用材料</h3>
              <ul className="space-y-1 text-sm text-foreground">
                {displayIngs.map((ing) => (
                  <li key={ing.id}>
                    {ing.name}{" "}
                    {[
                      scaleAmountText(ing.amount, multiplier, ing.quantity_numeric),
                      ing.unit,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(step.chef_notes || step.note) && (
            <div className="rounded-2xl bg-[#FFF9EA] p-4 text-sm text-[#6B3F24]">
              <p className="font-bold">老師提醒</p>
              <p className="mt-1 whitespace-pre-wrap">{step.chef_notes || step.note}</p>
            </div>
          )}
          {Array.isArray(step.common_failures) && step.common_failures.length > 0 ? (
            <div className="rounded-2xl border border-[#F2D8BF] p-4 text-sm">
              <p className="font-bold text-[#6B3F24]">常見失敗狀況</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
                {step.common_failures.map((f, i) => (
                  <li key={i}>{typeof f === "string" ? f : JSON.stringify(f)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {recipe.ai_enabled !== false && step.ai_enabled !== false ? (
            <button
              type="button"
              onClick={() => onAskStep(step)}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F2D8BF] bg-white font-bold text-[#6B3F24]",
                cookMode ? "min-h-14 text-base" : "min-h-11 text-sm"
              )}
            >
              問這一步
              {playbackCtx?.currentTimeSeconds != null
                ? ` · ${Math.floor(playbackCtx.currentTimeSeconds)}s`
                : ""}
              {playbackCtx?.markerTitle ? ` · ${playbackCtx.markerTitle}` : ""}
            </button>
          ) : null}
        </section>
      );
    }

    case "finish":
      return (
        <section className="space-y-4 text-center">
          <h2 className="text-2xl font-bold text-[#6B3F24]">完成！</h2>
          <p className="text-sm text-foreground-secondary">
            食譜已完成。你可以保存、分享成品，或繼續看商品與討論。
          </p>
          {recipe.tips ? (
            <div className="rounded-2xl bg-[#FFF9EA] p-4 text-left text-sm text-[#6B3F24]">
              <p className="font-bold">製作重點</p>
              <p className="mt-1 whitespace-pre-wrap">{recipe.tips}</p>
            </div>
          ) : null}
          <MissingIngredientsCartButton
            ingredients={ingredients}
            haveIds={haveIds}
            className="text-left"
          />
          {recipe.submission_enabled !== false ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => onGoToKind("submissions", { openSubmissionsForm: true })}
                className="min-h-11 flex-1 rounded-2xl bg-[#FF5A5F] px-4 text-sm font-bold text-white"
              >
                上傳我的作品
              </button>
              <button
                type="button"
                onClick={() => onGoToKind("submissions")}
                className="min-h-11 flex-1 rounded-2xl border border-[#F2D8BF] bg-white px-4 text-sm font-bold text-[#6B3F24]"
              >
                看看大家的成品
              </button>
            </div>
          ) : null}
          {recipe.discussion_enabled !== false ? (
            <button
              type="button"
              onClick={() => onGoToKind("discussion")}
              className="min-h-11 w-full rounded-2xl border border-[#F2D8BF] bg-[#FFF9EA] px-4 text-sm font-bold text-[#6B3F24]"
            >
              有問題？去討論區
            </button>
          ) : null}
          {recipe.product_recommendation_enabled !== false &&
          (recommendations.length > 0 ||
            ingredients.some((i) => i.product_id && i.products?.is_active !== false)) ? (
            <div className="text-left">
              <RecipeRecommendationsPanel
                recommendations={recommendations}
                ingredients={ingredients}
                title="還缺材料？看看推薦"
                subtitle="依老師設定與優先度排序，僅顯示站內可購買商品。"
                compact
              />
            </div>
          ) : null}
          {fullVideo ? (
            <div className="text-left">
              <h3 className="mb-2 font-bold text-[#6B3F24]">完整教學影片</h3>
              <RecipeMediaPlayer
                media={fullVideo}
                active={pageActive}
                onContextChange={onPlaybackContext}
              />
            </div>
          ) : recipe.videos?.video_url ? (
            <div className="text-left">
              <h3 className="mb-2 font-bold text-[#6B3F24]">完整教學影片</h3>
              <VideoEmbed url={recipe.videos.video_url} title={recipe.videos.title} />
            </div>
          ) : null}
        </section>
      );

    case "storage":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#6B3F24]">保存方式</h2>
          <p className="whitespace-pre-wrap text-sm text-foreground">{recipe.storage_method}</p>
        </section>
      );

    case "recommendations": {
      return (
        <RecipeRecommendationsPanel
          recommendations={recommendations}
          ingredients={ingredients}
        />
      );
    }

    case "faq":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#6B3F24]">常見問題</h2>
          <ul className="space-y-3">
            {faq.map((f) => (
              <li key={f.id} className="rounded-2xl border border-[#F2D8BF] bg-white p-4">
                <p className="font-semibold text-[#6B3F24]">Q. {f.question}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">A. {f.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      );

    case "discussion":
      return (
        <RecipeDiscussionPanel
          recipeId={recipe.id}
          steps={recipe.recipe_steps ?? []}
        />
      );

    case "submissions":
      return (
        <RecipeSubmissionsPanel
          recipeId={recipe.id}
          defaultShowForm={submissionsOpenForm}
        />
      );

    case "related":
      return (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#6B3F24]">相關食譜</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/recipes/${r.slug}`}
                  className="text-sm font-medium text-[#FF5A5F] hover:underline"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      );

    default:
      return null;
  }
}

function FullReadingView({
  data,
  multiplier,
  onMultiplierChange,
  haveIds,
  onToggleHave,
  onAskStep,
  onStartCook,
}: {
  data: SmartRecipePayload;
  multiplier: number;
  onMultiplierChange: (n: number) => void;
  haveIds: Set<string>;
  onToggleHave: (id: string) => void;
  onAskStep: (step: RecipeStep) => void;
  onStartCook: () => void;
}) {
  const { recipe, tools, preparations, faq, related, recommendations } = data;
  const total =
    recipe.total_time ??
    ((recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) || null);
  const steps = [...(recipe.recipe_steps ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.step_number - b.step_number
  );

  return (
    <article className="space-y-8">
      <div className="overflow-hidden rounded-[22px] border border-[#F2D8BF] bg-[#FFF9EA]/40">
        <div className="relative min-h-[180px]">
          {recipe.cover_image ? (
            <Image
              src={recipe.cover_image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          ) : (
            <div className="flex min-h-[180px] items-end bg-gradient-to-br from-[#FFF9EA] via-[#FFE8D6] to-[#FFD6A8] p-6">
              <div>
                <p className="text-xs font-medium text-[#6B3F24]">
                  {recipe.recipe_categories?.name ?? "食譜"}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-[#6B3F24] md:text-3xl">
                  {recipe.title}
                </h1>
              </div>
            </div>
          )}
        </div>
      </div>

      {recipe.cover_image ? (
        <h1 className="text-2xl font-bold text-[#6B3F24] md:text-3xl">{recipe.title}</h1>
      ) : null}

      {recipe.summary ? (
        <p className="text-base text-foreground-secondary">{recipe.summary}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-[#FFF9EA] px-3 py-1 text-[#6B3F24]">
          {difficultyLabel(recipe.difficulty)}
        </span>
        {total ? (
          <span className="rounded-full bg-[#FFF9EA] px-3 py-1 text-[#6B3F24]">約 {total} 分鐘</span>
        ) : null}
        {recipe.servings ? (
          <span className="rounded-full bg-[#FFF9EA] px-3 py-1 text-[#6B3F24]">{recipe.servings}</span>
        ) : null}
        {recipe.published_at ? (
          <span className="rounded-full border border-[#F2D8BF] bg-white px-3 py-1 text-foreground-secondary">
            {formatDate(recipe.published_at)}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onStartCook}
        className="min-h-11 rounded-2xl bg-[#FF5A5F] px-5 text-sm font-bold text-white"
      >
        開始製作（Cook Mode）
      </button>

      {recipe.content ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[#6B3F24]">簡介</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{recipe.content}</p>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#6B3F24]">材料清單</h2>
        <IngredientChecklist
          ingredients={recipe.recipe_ingredients ?? []}
          multiplier={multiplier}
          onMultiplierChange={onMultiplierChange}
          haveIds={haveIds}
          onToggleHave={onToggleHave}
          scalingEnabled={recipe.ingredient_scaling_enabled !== false}
        />
      </section>

      {tools.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#6B3F24]">器具</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {tools.map((t) => (
              <li key={t.id}>{t.name}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {preparations.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#6B3F24]">前置作業</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {preparations.map((p) => (
              <li key={p.id}>
                {p.title ? <strong>{p.title}：</strong> : null}
                {p.content}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#6B3F24]">製作步驟</h2>
        {recipe.ai_enabled !== false ? (
          <ol className="space-y-4">
            {steps.map((step) => (
              <li
                key={step.id}
                className="rounded-[18px] border border-[#F2D8BF] bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF9EA] text-sm font-bold text-[#FF5A5F]">
                    {step.step_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    {step.title ? (
                      <h3 className="font-semibold text-[#6B3F24]">{step.title}</h3>
                    ) : null}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {step.description}
                    </p>
                    {(step.chef_notes || step.note) && (
                      <p className="mt-2 rounded-xl bg-[#FFF9EA]/80 px-3 py-2 text-xs text-[#6B3F24]">
                        老師提醒：{step.chef_notes || step.note}
                      </p>
                    )}
                    {step.ai_enabled !== false ? (
                      <button
                        type="button"
                        onClick={() => onAskStep(step)}
                        className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-[#F2D8BF] px-3 text-xs font-bold text-[#6B3F24]"
                      >
                        問這一步
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <RecipeStepList steps={steps} />
        )}
      </section>

      {recipe.tips ? (
        <section className="rounded-[18px] bg-[#FFF9EA]/80 p-4">
          <h2 className="font-semibold text-[#6B3F24]">製作重點</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{recipe.tips}</p>
        </section>
      ) : null}

      {recipe.storage_method ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[#6B3F24]">保存方式</h2>
          <p className="text-sm">{recipe.storage_method}</p>
        </section>
      ) : null}

      {recipe.product_recommendation_enabled !== false ? (
        <RecipeRecommendationsPanel
          recommendations={recommendations}
          ingredients={recipe.recipe_ingredients ?? []}
        />
      ) : null}

      <MissingIngredientsCartButton
        ingredients={recipe.recipe_ingredients ?? []}
        haveIds={haveIds}
      />

      {recipe.videos?.video_url && !data.media.some((m) => !m.step_id && m.media_type === "video") ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#6B3F24]">教學影音</h2>
          <VideoEmbed url={recipe.videos.video_url} title={recipe.videos.title} />
        </section>
      ) : null}

      {pickPrimaryVideo(getRecipeLevelMedia(data.media)) ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#6B3F24]">完整教學影片</h2>
          <RecipeMediaPlayer
            media={pickPrimaryVideo(getRecipeLevelMedia(data.media))!}
            active
          />
        </section>
      ) : null}

      {faq.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#6B3F24]">常見問題</h2>
          <ul className="space-y-3">
            {faq.map((f) => (
              <li key={f.id} className="rounded-2xl border border-[#F2D8BF] p-4 text-sm">
                <p className="font-semibold">Q. {f.question}</p>
                <p className="mt-1">A. {f.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recipe.discussion_enabled !== false ? (
        <RecipeDiscussionPanel
          recipeId={recipe.id}
          steps={recipe.recipe_steps ?? []}
        />
      ) : null}

      {recipe.submission_enabled !== false ? (
        <RecipeSubmissionsPanel recipeId={recipe.id} />
      ) : null}

      {related.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#6B3F24]">相關食譜</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/recipes/${r.slug}`} className="text-sm font-medium text-[#FF5A5F]">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function previousStepSummary(steps: RecipeStep[], current: RecipeStep): string | null {
  const ordered = [...steps].sort(
    (a, b) => a.sort_order - b.sort_order || a.step_number - b.step_number
  );
  const idx = ordered.findIndex((s) => s.id === current.id);
  if (idx <= 0) return null;
  const prev = ordered[idx - 1];
  const title = prev.title?.trim() || `步驟 ${prev.step_number}`;
  return `${title}：${prev.description.slice(0, 120)}`;
}
