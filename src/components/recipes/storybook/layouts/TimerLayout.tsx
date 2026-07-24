"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type StoryTimerState = {
  pageId: string;
  remaining: number;
  running: boolean;
  initialSeconds: number;
  label?: string;
};

type TimerLayoutProps = {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  label?: string | null;
  remaining: number;
  running: boolean;
  initialSeconds: number;
  onToggleRunning: () => void;
  onReset: () => void;
  className?: string;
};

export function TimerLayout({
  title,
  subtitle,
  body,
  label,
  remaining,
  running,
  initialSeconds,
  onToggleRunning,
  onReset,
  className,
}: TimerLayoutProps) {
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const progress =
    initialSeconds > 0 ? Math.max(0, Math.min(1, remaining / initialSeconds)) : 0;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col items-center justify-center bg-[#1a100c] px-6 py-3 text-white",
        className
      )}
    >
      <div className="w-full max-w-sm space-y-6 text-center">
        {label || title ? (
          <div className="space-y-2">
            {label ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5A5F]">
                {label}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="text-sm text-white/70">{subtitle}</p>
            ) : null}
          </div>
        ) : null}

        <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#FF5A5F"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress)}`}
            />
          </svg>
          <span className="font-mono text-5xl font-bold tabular-nums tracking-tight">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </span>
        </div>

        {body ? (
          <p className="text-sm leading-relaxed text-white/75">{body}</p>
        ) : null}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onToggleRunning}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FF5A5F]"
            aria-label={running ? "暫停計時" : "開始計時"}
          >
            {running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10"
            aria-label="重設計時"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
