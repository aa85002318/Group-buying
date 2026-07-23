"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type CookTimerProps = {
  initialSeconds: number;
  className?: string;
  large?: boolean;
};

export function CookTimer({ initialSeconds, className, large }: CookTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(initialSeconds);
    setRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) {
      if (ref.current) window.clearInterval(ref.current);
      ref.current = null;
      return;
    }
    ref.current = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-[#F2D8BF] bg-[#FFF9EA] px-4 py-3",
        className
      )}
    >
      <span
        className={cn(
          "font-mono font-bold tabular-nums text-[#6B3F24]",
          large ? "text-3xl" : "text-xl"
        )}
      >
        {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-xl bg-[#FF5A5F] text-white",
            large ? "h-12 w-12" : "h-10 w-10"
          )}
          onClick={() => setRunning((v) => !v)}
          aria-label={running ? "暫停計時" : "開始計時"}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-xl border border-[#F2D8BF] bg-white text-[#6B3F24]",
            large ? "h-12 w-12" : "h-10 w-10"
          )}
          onClick={() => {
            setRunning(false);
            setRemaining(initialSeconds);
          }}
          aria-label="重設計時"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
