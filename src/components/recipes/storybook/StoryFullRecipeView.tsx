"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, HelpCircle, List, X } from "lucide-react";
import {
  StoryPageView,
} from "@/components/recipes/storybook/StoryPageView";
import { StoryAskTeacherSheet } from "@/components/recipes/storybook/StoryAskTeacherSheet";
import { RecipeSubmissionsPanel } from "@/components/recipes/RecipeSubmissionsPanel";
import { parseContentConfig } from "@/components/recipes/storybook/story-media";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import {
  parseReaderSettings,
} from "@/lib/recipes/reader-settings";
import {
  buildReaderPages,
  pageAnchorId,
  tocLabelForPage,
  type ReaderPage,
} from "@/lib/recipes/reader-pages";
import type { StorybookPayload } from "@/lib/recipes/storybook";
import type { StoryComparisonOption } from "@/lib/recipes/story-types";
import { cn } from "@/lib/utils";

type Props = {
  data: SmartRecipePayload;
  stories: StorybookPayload;
};

/**
 * Full Recipe Renderer — same recipe_story_pages as flip, scrolled once.
 */
export function StoryFullRecipeView({ data, stories }: Props) {
  const { recipe } = data;
  const settings = useMemo(
    () => parseReaderSettings(recipe.reader_settings),
    [recipe.reader_settings]
  );
  const pages = useMemo(
    () => buildReaderPages(stories.chapters, recipe.title, settings),
    [stories.chapters, recipe.title, settings]
  );

  const [tocOpen, setTocOpen] = useState(false);
  const [haveIds, setHaveIds] = useState<Set<string>>(new Set());
  const [completedPageIds, setCompletedPageIds] = useState<Set<string>>(new Set());
  const [comparisonByPage, setComparisonByPage] = useState<Record<string, string>>({});
  const [checkpointByPage, setCheckpointByPage] = useState<Record<string, Set<string>>>({});
  const [askCtx, setAskCtx] = useState<{
    storyPageId: string;
    chapterId?: string | null;
    stepId?: string | null;
    title?: string | null;
  } | null>(null);

  const contentPages = pages.filter((p) => p.page_type !== "toc");
  const tocEntries = contentPages.map((p) => ({
    id: p.id,
    title: tocLabelForPage(p),
    anchor: pageAnchorId(p.id),
  }));

  const scrollTo = (anchor: string) => {
    setTocOpen(false);
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleHave = (id: string) => {
    setHaveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markComplete = (pageId: string) => {
    setCompletedPageIds((prev) => {
      if (prev.has(pageId)) return prev;
      const next = new Set(prev);
      next.add(pageId);
      return next;
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFF9EA] text-[#3D2914]">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#F2D8BF] bg-[#FFF9EA]/95 px-3 py-2 backdrop-blur">
        <Link
          href="/recipes"
          className="inline-flex h-10 items-center gap-0.5 rounded-xl px-2 text-sm font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold">{recipe.title}</p>
          <p className="text-[11px] text-[#6B3F24]/70">完整食譜</p>
        </div>
        {settings.showToc ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
            onClick={() => setTocOpen(true)}
            aria-label="目錄"
          >
            <List className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-10" />
        )}
      </header>

      {settings.showToc ? (
        <nav className="border-b border-[#F2D8BF] bg-white px-4 py-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-[#FF5A5F]">目錄</p>
          <ol className="flex flex-wrap gap-2">
            {tocEntries.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(e.anchor)}
                  className="rounded-full border border-[#F2D8BF] bg-[#FFF9EA] px-3 py-1.5 text-xs font-medium hover:border-[#FF5A5F]"
                >
                  {String(i + 1).padStart(2, "0")} {e.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <main className="mx-auto w-full max-w-3xl space-y-0 pb-16">
        {contentPages.map((page) => (
          <FullPageSection
            key={page.id}
            page={page}
            data={data}
            settings={settings}
            haveIds={haveIds}
            onToggleHave={toggleHave}
            completedPageIds={completedPageIds}
            onMarkComplete={markComplete}
            comparisonChoice={comparisonByPage[page.id] ?? null}
            onComparisonChoice={(pageId, option) => {
              setComparisonByPage((prev) => ({ ...prev, [pageId]: option.id }));
              markComplete(pageId);
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
            onAsk={(ctx) => setAskCtx(ctx)}
          />
        ))}
      </main>

      {tocOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <button type="button" className="flex-1" aria-label="關閉" onClick={() => setTocOpen(false)} />
          <aside className="flex h-full w-[min(100%,320px)] flex-col bg-[#FFF9EA] shadow-2xl">
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
                    onClick={() => scrollTo(e.anchor)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white"
                  >
                    <span className="truncate">{e.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
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
    </div>
  );
}

function FullPageSection({
  page,
  data,
  settings,
  haveIds,
  onToggleHave,
  completedPageIds,
  onMarkComplete,
  comparisonChoice,
  onComparisonChoice,
  checkpointChecked,
  onCheckpointToggle,
  onAsk,
}: {
  page: ReaderPage;
  data: SmartRecipePayload;
  settings: ReturnType<typeof parseReaderSettings>;
  haveIds: Set<string>;
  onToggleHave: (id: string) => void;
  completedPageIds: Set<string>;
  onMarkComplete: (pageId: string) => void;
  comparisonChoice: string | null;
  onComparisonChoice: (pageId: string, option: StoryComparisonOption) => void;
  checkpointChecked: Set<string>;
  onCheckpointToggle: (itemId: string) => void;
  onAsk: (ctx: {
    storyPageId: string;
    chapterId?: string | null;
    stepId?: string | null;
    title?: string | null;
  }) => void;
}) {
  const config = parseContentConfig(page);
  const timerSeconds =
    typeof config.timerSeconds === "number" && config.timerSeconds > 0
      ? config.timerSeconds
      : 60;
  const isShare =
    page.page_type === "submissions" || page.page_type === "gallery";

  return (
    <section
      id={pageAnchorId(page.id)}
      className={cn(
        "scroll-mt-16 border-b border-[#F2D8BF]/80",
        isShare ? "bg-white" : ""
      )}
    >
      {page.page_type === "cover" ? (
        <div className="px-5 py-10 text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#FF5A5F]">
            CHIMEIDIY
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold">{page.title || data.recipe.title}</h1>
          {page.subtitle || data.recipe.summary ? (
            <p className="mx-auto mt-3 max-w-lg text-sm text-[#6B3F24]/80">
              {page.subtitle || data.recipe.summary}
            </p>
          ) : null}
        </div>
      ) : isShare ? (
        <div className="px-4 py-8 sm:px-6">
          <h2 className="font-serif text-2xl font-bold">
            {page.title || "分享你的作品"}
          </h2>
          <p className="mt-2 text-sm text-[#6B3F24]/80">
            {page.body ||
              "完成這份食譜了嗎？歡迎上傳成品照片與製作心得，與大家交流；也可以設定為只限自己查看，保存這次的烘焙紀錄。此步驟可以略過，之後再回來分享。"}
          </p>
          <div className="mt-6">
            <RecipeSubmissionsPanel
              recipeId={data.recipe.id}
              defaultShowForm
              skippable
              onSkip={() => {
                window.location.href = "/recipes";
              }}
            />
          </div>
        </div>
      ) : (
        <div className="relative min-h-[50vh]">
          <StoryPageView
            page={page}
            pageActive
            data={data}
            multiplier={1}
            onMultiplierChange={() => {}}
            haveIds={haveIds}
            onToggleHave={onToggleHave}
            muted
            guided={false}
            completedPageIds={completedPageIds}
            onMarkComplete={onMarkComplete}
            comparisonChoice={comparisonChoice}
            onComparisonChoice={onComparisonChoice}
            checkpointChecked={checkpointChecked}
            onCheckpointToggle={onCheckpointToggle}
            timerRemaining={timerSeconds}
            timerRunning={false}
            timerInitial={timerSeconds}
            timerLabel={config.timerLabel}
            onTimerToggle={() => onMarkComplete(page.id)}
            onTimerReset={() => {}}
            onAskAi={(ctx) => {
              if (!settings.showAskTeacher) return;
              onAsk({
                storyPageId: ctx.storyPageId,
                chapterId: ctx.chapterId,
                stepId: ctx.stepId,
                title: ctx.title,
              });
            }}
            onPlaybackContext={() => {}}
            hideScaling
            readerSettings={settings}
          />
          {settings.showAskTeacher && !page.__synthetic ? (
            <div className="flex justify-center px-4 pb-6">
              <button
                type="button"
                onClick={() =>
                  onAsk({
                    storyPageId: page.id,
                    chapterId: page.chapter_id,
                    stepId: page.step_id,
                    title: page.title,
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-[#F2D8BF] bg-white px-4 py-2 text-xs font-semibold text-[#6B3F24]"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                我要提問
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
