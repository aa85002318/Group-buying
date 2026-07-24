"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Maximize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  formatMediaTime,
  sortedMarkers,
  type RecipePlaybackContext,
} from "@/lib/recipes/media";
import { isPlayableUploadedSource } from "@/lib/recipes/video-upload";
import type { RecipeMedia } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.25] as const;

type RecipeMediaPlayerProps = {
  media: RecipeMedia;
  /** When false, pause and stop loading (leave page). */
  active?: boolean;
  className?: string;
  showMarkers?: boolean;
  /** Clip start within uploaded file. */
  startSeconds?: number;
  endSeconds?: number;
  mutedOverride?: boolean;
  initialSpeed?: number;
  onContextChange?: (ctx: RecipePlaybackContext) => void;
  onReplayRequest?: () => void;
};

export function RecipeMediaPlayer({
  media,
  active = true,
  className,
  showMarkers = true,
  startSeconds,
  endSeconds,
  mutedOverride,
  initialSpeed = 1,
  onContextChange,
  onReplayRequest,
}: RecipeMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clipStart = Math.max(
    0,
    startSeconds ?? (media.start_seconds != null ? Number(media.start_seconds) : 0)
  );
  const clipEnd =
    endSeconds ?? (media.end_seconds != null ? Number(media.end_seconds) : undefined);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(mutedOverride ?? media.muted !== false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [current, setCurrent] = useState(clipStart);
  const [duration, setDuration] = useState(media.duration_seconds ?? 0);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  const markers = useMemo(() => sortedMarkers(media), [media]);
  const playable =
    Boolean(media.url) &&
    isPlayableUploadedSource(media.source_type) &&
    media.processing_status !== "placeholder" &&
    media.processing_status !== "migration_required" &&
    media.is_active !== false;

  const emitContext = useCallback(
    (time: number, markerId: string | null) => {
      if (!onContextChange) return;
      const marker = markers.find((m) => m.id === markerId) ?? null;
      onContextChange({
        mediaId: media.id,
        currentTimeSeconds: Math.floor(time),
        markerId: marker?.id ?? null,
        markerTitle: marker?.title ?? null,
        markerAiContext: marker?.ai_context ?? null,
      });
    },
    [media.id, markers, onContextChange]
  );

  useEffect(() => {
    if (mutedOverride != null) setMuted(mutedOverride);
  }, [mutedOverride]);

  useEffect(() => {
    if (active) return;
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setPlaying(false);
    setCurrent(clipStart);
  }, [active, clipStart]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !active || !playable) return;
    el.muted = muted;
    el.playbackRate = speed;
  }, [muted, speed, active, playable]);

  useEffect(() => {
    if (!active || !playable) return;
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => {
      const t = el.currentTime;
      setCurrent(t);
      if (clipEnd != null && t >= clipEnd) {
        el.pause();
        setPlaying(false);
      }
      const nearest = [...markers]
        .reverse()
        .find((m) => t >= m.time_seconds - 0.25);
      const mid = nearest?.id ?? null;
      setActiveMarkerId(mid);
      emitContext(t, mid);
    };
    const onMeta = () => {
      setDuration(el.duration || media.duration_seconds || 0);
      if (clipStart > 0 && Math.abs(el.currentTime - clipStart) > 0.35) {
        el.currentTime = clipStart;
        setCurrent(clipStart);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [
    active,
    playable,
    markers,
    emitContext,
    media.duration_seconds,
    clipStart,
    clipEnd,
  ]);

  const seekTo = (seconds: number, markerId?: string | null) => {
    if (!videoRef.current) return;
    const clamped =
      clipEnd != null ? Math.min(seconds, clipEnd) : seconds;
    const next = Math.max(clipStart, clamped);
    videoRef.current.currentTime = next;
    setCurrent(next);
    setActiveMarkerId(markerId ?? null);
    emitContext(next, markerId ?? null);
    videoRef.current.play().catch(() => {});
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const restart = () => {
    if (onReplayRequest) onReplayRequest();
    seekTo(clipStart, null);
  };

  const toggleFullscreen = () => {
    const node = containerRef.current;
    if (!node) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else node.requestFullscreen?.().catch(() => {});
  };

  if (media.media_type === "image" || media.media_type === "keyframe") {
    if (!media.url) {
      return (
        <div
          className={cn(
            "flex aspect-video items-center justify-center rounded-2xl bg-[#F5F0E8] text-sm text-[#6B3F24]/70",
            className
          )}
        >
          尚無圖片
        </div>
      );
    }
    return (
      <div className={cn("overflow-hidden rounded-2xl border border-[#F2D8BF] bg-[#FFF9EA]", className)}>
        <div className="relative aspect-video">
          <Image
            src={media.url}
            alt={media.alt_text || "關鍵畫面"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
        {media.alt_text ? (
          <p className="px-3 py-2 text-xs text-foreground-secondary">{media.alt_text}</p>
        ) : null}
      </div>
    );
  }

  if (!active) {
    return (
      <div
        className={cn(
          "relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-[#1a1a1a] text-sm text-white/60",
          className
        )}
      >
        {media.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.thumbnail_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}
        <span className="relative z-10">影片已暫停（離開此頁）</span>
      </div>
    );
  }

  if (!playable) {
    return (
      <div
        className={cn(
          "relative flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#F5F0E8] px-4 text-center",
          className
        )}
      >
        {media.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.thumbnail_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : null}
        <p className="relative z-10 text-sm font-medium text-[#6B3F24]">
          {media.processing_status === "placeholder" || media.is_demo
            ? "DEMO 教學影片待上傳"
            : "教學影片準備中"}
        </p>
        <p className="relative z-10 text-xs text-[#6B3F24]/70">
          請於後台上傳 MP4 檔案後即可播放
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl bg-black"
      >
        <div className="relative aspect-video">
          {errored ? (
            <div className="flex h-full items-center justify-center text-sm text-white">
              影片載入失敗
            </div>
          ) : (
            <video
              ref={videoRef}
              key={media.id}
              src={media.url ?? undefined}
              poster={media.thumbnail_url ?? undefined}
              muted={muted}
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
              onError={() => setErrored(true)}
            >
              {media.subtitle_url ? (
                <track
                  kind="subtitles"
                  src={media.subtitle_url}
                  srcLang={media.subtitle_language || "zh"}
                  label={media.subtitle_label || "字幕"}
                  default
                />
              ) : null}
            </video>
          )}
        </div>

        {!errored ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
            <input
              type="range"
              min={clipStart}
              max={Math.max(clipStart + 1, clipEnd ?? duration)}
              step={0.1}
              value={current}
              onChange={(e) => seekTo(Number(e.target.value), activeMarkerId)}
              className="mb-2 w-full accent-[#FF5A5F]"
              aria-label="進度"
            />
            <div className="flex flex-wrap items-center gap-2 text-white">
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                aria-label={playing ? "暫停" : "播放"}
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={restart}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                aria-label="重新播放"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                aria-label={muted ? "開啟聲音" : "靜音"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <span className="text-xs tabular-nums">
                {formatMediaTime(current)} / {formatMediaTime(clipEnd ?? duration)}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {media.allow_slow_playback !== false
                  ? SPEEDS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeed(s)}
                        className={cn(
                          "rounded-full px-2 py-1 text-[11px] font-semibold",
                          speed === s ? "bg-[#FF5A5F]" : "bg-white/15"
                        )}
                      >
                        {s}x
                      </button>
                    ))
                  : null}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                  aria-label="全螢幕"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showMarkers && markers.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold text-[#6B3F24]">時間標記</p>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {markers.map((m) => (
              <li key={m.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => seekTo(m.time_seconds, m.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs",
                    activeMarkerId === m.id
                      ? "border-[#FF5A5F] bg-[#FF5A5F] text-white"
                      : "border-[#F2D8BF] bg-white text-[#6B3F24]"
                  )}
                >
                  <span className="font-mono font-bold">{formatMediaTime(m.time_seconds)}</span>
                  <span className="mt-0.5 block max-w-[140px] truncate">{m.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type RecipeKeyframeStripProps = {
  items: RecipeMedia[];
  className?: string;
};

export function RecipeKeyframeStrip({ items, className }: RecipeKeyframeStripProps) {
  if (!items.length) return null;
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-bold text-[#6B3F24]">關鍵畫面</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((m) => (
          <div
            key={m.id}
            className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-[#F2D8BF] bg-[#FFF9EA]"
          >
            {m.thumbnail_url || m.url ? (
              <Image
                src={m.thumbnail_url || m.url!}
                alt={m.alt_text || "關鍵畫面"}
                fill
                className="object-cover"
                sizes="144px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-[#6B3F24]/50">
                無圖
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
