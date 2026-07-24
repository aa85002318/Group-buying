"use client";

import Image from "next/image";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { RecipeDiscussionPanel } from "@/components/recipes/RecipeDiscussionPanel";
import { RecipeRecommendationsPanel } from "@/components/recipes/RecipeRecommendations";
import { RecipeSubmissionsPanel } from "@/components/recipes/RecipeSubmissionsPanel";
import { FullBleedVisual } from "@/components/recipes/storybook/layouts/FullBleedVisual";
import { SplitImageText } from "@/components/recipes/storybook/layouts/SplitImageText";
import { VideoLead } from "@/components/recipes/storybook/layouts/VideoLead";
import { GalleryFrames } from "@/components/recipes/storybook/layouts/GalleryFrames";
import { StateComparison } from "@/components/recipes/storybook/layouts/StateComparison";
import { Checkpoint } from "@/components/recipes/storybook/layouts/Checkpoint";
import { TimerLayout } from "@/components/recipes/storybook/layouts/TimerLayout";
import { ListLayout } from "@/components/recipes/storybook/layouts/ListLayout";
import type { StoryAiContext } from "@/components/recipes/storybook/StoryPageAiSheet";
import {
  clipBounds,
  pageMediaToRecipeMedia,
  parseCompletionConfig,
  parseContentConfig,
  primaryMedia,
} from "@/components/recipes/storybook/story-media";
import type { SmartRecipePayload } from "@/lib/recipes/flip-pages";
import type { RecipePlaybackContext } from "@/lib/recipes/media";
import type { RecipeReaderSettings } from "@/lib/recipes/reader-settings";
import type {
  RecipeStoryChapter,
  RecipeStoryPage,
  RecipeStoryPageMedia,
} from "@/lib/types/database";
import type {
  StoryComparisonOption,
  StoryGalleryMode,
  StorySplitDirection,
} from "@/lib/recipes/story-types";
import { cn } from "@/lib/utils";

export type FlatStoryPage = RecipeStoryPage & {
  recipe_story_page_media: RecipeStoryPageMedia[];
  chapter?: RecipeStoryChapter | null;
};

export type StoryPageViewProps = {
  page: FlatStoryPage;
  pageActive: boolean;
  data: SmartRecipePayload;
  multiplier: number;
  onMultiplierChange: (v: number) => void;
  haveIds: Set<string>;
  onToggleHave: (id: string) => void;
  muted: boolean;
  guided: boolean;
  completedPageIds: Set<string>;
  onMarkComplete: (pageId: string) => void;
  comparisonChoice: string | null;
  onComparisonChoice: (pageId: string, option: StoryComparisonOption) => void;
  checkpointChecked: Set<string>;
  onCheckpointToggle: (itemId: string) => void;
  timerRemaining: number;
  timerRunning: boolean;
  timerInitial: number;
  timerLabel?: string | null;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  onAskAi: (ctx: StoryAiContext) => void;
  onPlaybackContext: (ctx: RecipePlaybackContext) => void;
  onStartFree?: () => void;
  onStartGuided?: () => void;
  stepIndexLabel?: string | null;
  /** V3: hide recipe scaling UI */
  hideScaling?: boolean;
  readerSettings?: RecipeReaderSettings;
  /** Flip book: fill parent frame, no 100dvh min-heights */
  bookFit?: boolean;
};

export function StoryPageView(props: StoryPageViewProps) {
  const { page, data, bookFit } = props;
  const config = parseContentConfig(page);
  const completion = parseCompletionConfig(page);
  const media = page.recipe_story_page_media ?? [];
  const layout = page.layout_type || inferLayout(page.page_type);
  const pageType = page.page_type;
  const preferVideo =
    layout === "video_lead" ||
    pageType === "step_video" ||
    pageType === "full_video" ||
    pageType === "step";
  const primary = primaryMedia(media, preferVideo ? "video" : "any");
  const hideScaling = props.hideScaling !== false;
  const showAsk = props.readerSettings?.showAskTeacher !== false;
  const shell = bookFit
    ? "flex h-full min-h-0 w-full flex-col overflow-hidden"
    : "flex min-h-[min(100dvh,820px)] w-full flex-col";
  const pad = bookFit ? "px-4 py-3 sm:px-6" : "px-5 pb-28 pt-16 sm:px-8";

  if (pageType === "cover") {
    return (
      <FullBleedVisual
        imageUrl={primary?.url || data.recipe.cover_image}
        videoUrl={primary?.media_type === "video" ? primary.url : null}
        eyebrow={page.eyebrow || data.recipe.title}
        title={page.title || data.recipe.title}
        subtitle={page.subtitle || data.recipe.summary}
        body={page.body}
        alignment={page.alignment || "bottom_left"}
        overlayOpacity={config.overlayOpacity}
        bookFit={bookFit}
      >
        <div className="flex flex-wrap gap-3 pt-4">
          {props.onStartFree ? (
            <button
              type="button"
              onClick={props.onStartFree}
              className="min-h-12 rounded-full border border-white/40 bg-white/15 px-5 text-sm font-bold backdrop-blur"
            >
              看看食譜
            </button>
          ) : null}
          {props.onStartGuided ? (
            <button
              type="button"
              onClick={props.onStartGuided}
              className="min-h-12 rounded-full bg-[#FF5A5F] px-5 text-sm font-bold text-white"
            >
              開始跟做
            </button>
          ) : null}
        </div>
      </FullBleedVisual>
    );
  }

  if (pageType === "challenge") {
    const hours = config.challengeHours ?? 48;
    const badge = config.challengeBadgeLabel || "完成徽章";
    const challengeHref =
      typeof config.challengeHref === "string" && config.challengeHref
        ? config.challengeHref
        : "/challenges";
    return (
      <div
        className={cn(
          shell,
          pad,
          "justify-center bg-[#FFF9EA] text-[#3D2914]",
          bookFit && "overflow-y-auto overscroll-contain"
        )}
      >
        <p className="text-xs font-semibold tracking-[0.16em] text-[#FF5A5F]">
          CHALLENGE
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold">
          {page.title || "食譜挑戰"}
        </h2>
        {page.subtitle ? (
          <p className="mt-2 text-base text-[#6B3F24]/80">{page.subtitle}</p>
        ) : null}
        <div className="mt-8 space-y-4 rounded-3xl border border-[#F2D8BF] bg-white p-5">
          <p className="text-lg font-bold">{hours} 小時內完成</p>
          <p className="text-sm text-[#6B3F24]/80">
            {page.body || `完成即可取得${badge}`}
          </p>
          <Link
            href={challengeHref}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FF5A5F] px-5 text-sm font-bold text-white"
          >
            查看挑戰活動
          </Link>
        </div>
      </div>
    );
  }

  if (pageType === "discussion") {
    return (
      <EmbedShell title={page.title || "問題討論"} subtitle={page.subtitle} bookFit={bookFit}>
        <RecipeDiscussionPanel
          recipeId={data.recipe.id}
          steps={data.recipe.recipe_steps ?? []}
          compact
        />
      </EmbedShell>
    );
  }

  if (pageType === "submissions" || pageType === "gallery") {
    return (
      <EmbedShell title={page.title || "分享你的作品"} subtitle={page.subtitle} bookFit={bookFit}>
        <p className="mb-4 text-sm leading-relaxed text-[#6B3F24]/80">
          {page.body ||
            "完成這份食譜了嗎？歡迎上傳成品照片與製作心得，與大家交流；也可以設定為只限自己查看。此步驟可以略過。"}
        </p>
        <RecipeSubmissionsPanel
          recipeId={data.recipe.id}
          compact
          defaultShowForm
          skippable
        />
      </EmbedShell>
    );
  }

  if (pageType === "recommendations") {
    return (
      <EmbedShell title={page.title || "商品推薦"} subtitle={page.subtitle} bookFit={bookFit}>
        <RecipeRecommendationsPanel
          recommendations={data.recommendations}
          ingredients={data.recipe.recipe_ingredients ?? []}
          compact
        />
      </EmbedShell>
    );
  }

  if (pageType === "related") {
    return (
      <EmbedShell title={page.title || "相關食譜"} subtitle={page.subtitle} bookFit={bookFit}>
        <ul className="space-y-3">
          {data.related.map((r) => (
            <li key={r.id}>
              <Link
                href={`/recipes/${r.slug || r.id}`}
                className="flex gap-3 overflow-hidden rounded-xl"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden bg-[#F2D8BF]">
                  {r.cover_image ? (
                    <Image
                      src={r.cover_image}
                      alt={r.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : null}
                </div>
                <div className="flex items-center">
                  <p className="font-semibold text-[#6B3F24]">{r.title}</p>
                </div>
              </Link>
            </li>
          ))}
          {!data.related.length ? (
            <p className="text-sm text-[#6B3F24]/60">暫無相關食譜</p>
          ) : null}
        </ul>
      </EmbedShell>
    );
  }

  if (
    pageType === "ingredients" ||
    pageType === "tools" ||
    pageType === "preparation" ||
    pageType === "preparations" ||
    layout === "list"
  ) {
    return (
      <ListLayout
        pageType={pageType === "preparations" ? "preparation" : pageType}
        title={page.title}
        subtitle={page.subtitle}
        body={page.body}
        ingredients={data.recipe.recipe_ingredients ?? []}
        tools={data.tools}
        preparations={data.preparations}
        multiplier={1}
        onMultiplierChange={() => {}}
        haveIds={props.haveIds}
        onToggleHave={props.onToggleHave}
        scalingEnabled={!hideScaling && data.recipe.ingredient_scaling_enabled !== false}
        bookFit={bookFit}
      />
    );
  }

  if (layout === "comparison" || pageType === "comparison") {
    const options = config.comparisonOptions ?? [];
    return (
      <StateComparison
        title={page.title}
        prompt={config.comparisonPrompt || page.body}
        options={options}
        selectedId={props.comparisonChoice}
        onSelect={(opt) => {
          props.onComparisonChoice(page.id, opt);
          props.onMarkComplete(page.id);
        }}
        className={bookFit ? "overflow-y-auto overscroll-contain" : undefined}
        onAskAi={
          showAsk
            ? (opt) =>
                props.onAskAi({
                  storyPageId: page.id,
                  chapterId: page.chapter_id,
                  stepId: page.step_id,
                  title: page.title,
                  body: page.body,
                  aiContext: page.ai_context || opt.aiPrompt || opt.outcome,
                  comparisonChoice: opt.label,
                  initialPrompt: opt.aiPrompt || `我選了「${opt.label}」，該怎麼辦？`,
                })
            : undefined
        }
      />
    );
  }

  if (layout === "checkpoint" || pageType === "checkpoint" || pageType === "ai_help") {
    const items =
      completion.checklist?.length
        ? completion.checklist
        : [
            { id: "ok", text: "外觀與觸感符合說明" },
            { id: "safe", text: "沒有異常氣味或變色" },
          ];
    return (
      <Checkpoint
        title={page.title}
        subtitle={page.subtitle}
        body={page.body}
        items={items}
        checkedIds={props.checkpointChecked}
        className={bookFit ? undefined : "!min-h-[min(100dvh,820px)]"}
        onToggle={(id) => {
          props.onCheckpointToggle(id);
          const next = new Set(props.checkpointChecked);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          if (items.every((i) => next.has(i.id))) props.onMarkComplete(page.id);
        }}
        continueLabel={completion.continueLabel}
        mismatchLabel={completion.mismatchLabel}
        onContinue={() => props.onMarkComplete(page.id)}
        onMismatchAi={
          showAsk
            ? () =>
                props.onAskAi({
                  storyPageId: page.id,
                  chapterId: page.chapter_id,
                  stepId: page.step_id,
                  title: page.title,
                  body: page.body,
                  aiContext: page.ai_context || completion.mismatchAiPrompt,
                  initialPrompt:
                    completion.mismatchAiPrompt || "檢查點看起來不太對，該怎麼排查？",
                })
            : undefined
        }
      />
    );
  }

  if (layout === "timer" || pageType === "timer") {
    return (
      <TimerLayout
        title={page.title}
        subtitle={page.subtitle}
        body={page.body}
        label={props.timerLabel || config.timerLabel}
        remaining={props.timerRemaining}
        running={props.timerRunning}
        initialSeconds={props.timerInitial}
        onToggleRunning={() => {
          props.onTimerToggle();
          props.onMarkComplete(page.id);
        }}
        onReset={props.onTimerReset}
        className={bookFit ? "overflow-y-auto overscroll-contain" : undefined}
      />
    );
  }

  if (layout === "gallery" && pageType !== "gallery" && pageType !== "submissions") {
    const frames =
      config.frames?.map((f, i) => ({
        id: f.id || `frame-${i}`,
        title: f.title,
        caption: f.caption,
        imageUrl: f.imageUrl || media[i]?.url || undefined,
        number: f.number ?? i + 1,
      })) ??
      media.map((m, i) => ({
        id: m.id,
        title: m.caption ?? undefined,
        caption: m.alt_text ?? undefined,
        imageUrl: m.url ?? undefined,
        number: i + 1,
      }));
    return (
      <GalleryFrames
        title={page.title}
        subtitle={page.subtitle}
        frames={frames}
        mode={(config.galleryMode as StoryGalleryMode) || "swipe"}
        className={bookFit ? "overflow-y-auto overscroll-contain" : "!min-h-[min(100dvh,820px)]"}
      />
    );
  }

  if (
    layout === "video_lead" ||
    pageType === "step_video" ||
    pageType === "full_video" ||
    (pageType === "step" && primary?.media_type === "video")
  ) {
    if (!primary) {
      return (
        <SplitImageText
          title={page.title}
          subtitle={page.subtitle}
          body={page.body || "尚無影片"}
          eyebrow={props.stepIndexLabel || page.eyebrow}
          bookFit={bookFit}
        />
      );
    }
    const recipeMedia = pageMediaToRecipeMedia(primary, data.recipe.id);
    const clip = clipBounds(primary, config);
    const markers = media
      .filter((m) => m.media_type === "keyframe" || m.caption)
      .map((m) => ({
        id: m.id,
        label: m.caption || m.alt_text || "標記",
        seconds:
          typeof m.metadata?.time_seconds === "number"
            ? (m.metadata.time_seconds as number)
            : undefined,
      }));

    return (
      <VideoLead
        stepLabel={props.stepIndexLabel || page.eyebrow}
        title={page.title}
        note={page.body || page.subtitle}
        media={recipeMedia}
        pageActive={props.pageActive}
        startSeconds={clip.startSeconds}
        endSeconds={clip.endSeconds}
        muted={props.muted}
        bookFit={bookFit}
        markers={markers}
        onPlaybackContext={props.onPlaybackContext}
        onAskAi={
          showAsk
            ? () =>
                props.onAskAi({
                  storyPageId: page.id,
                  chapterId: page.chapter_id,
                  stepId: page.step_id,
                  title: page.title,
                  body: page.body,
                  aiContext: page.ai_context,
                })
            : undefined
        }
      />
    );
  }

  if (layout === "full_bleed" || pageType === "full_image" || pageType === "chapter") {
    return (
      <FullBleedVisual
        imageUrl={primary?.url || page.chapter?.cover_image}
        videoUrl={primary?.media_type === "video" ? primary.url : null}
        eyebrow={page.eyebrow || page.chapter?.title}
        title={page.title}
        subtitle={page.subtitle}
        body={page.body}
        alignment={page.alignment || "bottom_left"}
        overlayOpacity={config.overlayOpacity}
        bookFit={bookFit}
      >
        {showAsk && page.ai_context ? (
          <AskTeacherChip
            onClick={() =>
              props.onAskAi({
                storyPageId: page.id,
                chapterId: page.chapter_id,
                stepId: page.step_id,
                title: page.title,
                body: page.body,
                aiContext: page.ai_context,
              })
            }
          />
        ) : null}
      </FullBleedVisual>
    );
  }

  if (pageType === "temperature") {
    return (
      <FullBleedVisual
        imageUrl={primary?.url}
        eyebrow={page.eyebrow || "溫度"}
        title={
          page.title ||
          (config.temperatureValue != null
            ? `${config.temperatureValue}°${config.temperatureUnit || "C"}`
            : "溫度提醒")
        }
        subtitle={config.temperatureLabel || page.subtitle}
        body={page.body}
        alignment={page.alignment || "center"}
        bookFit={bookFit}
      />
    );
  }

  if (pageType === "completion") {
    // Deprecated celebration pages — should be filtered by buildReaderPages
    return null;
  }

  if (pageType === "storage") {
    return (
      <div
        className={cn(
          "flex w-full flex-col bg-[#FFF9EA]",
          bookFit ? "h-full min-h-0 overflow-hidden" : "min-h-[min(100dvh,820px)]"
        )}
      >
        <FullBleedVisual
          className={bookFit ? undefined : "!min-h-[45vh]"}
          imageUrl={primary?.url || data.recipe.cover_image}
          eyebrow={page.eyebrow || "保存"}
          title={page.title}
          subtitle={page.subtitle}
          body={page.body}
          alignment={page.alignment || "bottom_left"}
          bookFit={bookFit}
        />
      </div>
    );
  }

  // Default: split image/text
  return (
    <SplitImageText
      imageUrl={primary?.url}
      eyebrow={props.stepIndexLabel || page.eyebrow}
      title={page.title}
      subtitle={page.subtitle}
      body={page.body}
      splitDirection={(config.splitDirection as StorySplitDirection) || "image_left"}
      bookFit={bookFit}
    >
      {showAsk && page.ai_context ? (
        <AskTeacherChip
          onClick={() =>
            props.onAskAi({
              storyPageId: page.id,
              chapterId: page.chapter_id,
              stepId: page.step_id,
              title: page.title,
              body: page.body,
              aiContext: page.ai_context,
            })
          }
        />
      ) : null}
    </SplitImageText>
  );
}

function EmbedShell({
  title,
  subtitle,
  children,
  bookFit,
}: {
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
  bookFit?: boolean;
}) {
  return (
    <div
      className={cn(
        bookFit
          ? "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#FFF9EA] px-4 py-3 sm:px-6"
          : "flex min-h-[min(100dvh,820px)] w-full flex-col bg-[#FFF9EA] px-4 pb-28 pt-16 sm:px-6"
      )}
    >
      <div className="mb-3 shrink-0 space-y-1">
        <h2 className="text-xl font-bold text-[#6B3F24] sm:text-2xl">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-[#6B3F24]/75">{subtitle}</p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </div>
  );
}

function AskTeacherChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#FF5A5F] px-4 text-sm font-semibold text-white"
      )}
    >
      <HelpCircle className="h-4 w-4" />
      我要提問
    </button>
  );
}

function inferLayout(pageType: string): string {
  switch (pageType) {
    case "full_image":
    case "chapter":
    case "cover":
      return "full_bleed";
    case "step_video":
    case "full_video":
    case "step":
      return "video_lead";
    case "gallery":
      return "gallery";
    case "comparison":
      return "comparison";
    case "checkpoint":
    case "ai_help":
      return "checkpoint";
    case "timer":
      return "timer";
    case "ingredients":
    case "tools":
    case "preparation":
    case "toc":
      return "list";
    default:
      return "split_image_text";
  }
}
