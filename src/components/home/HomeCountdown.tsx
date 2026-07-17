"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

function formatRemaining(endAt: string): string {
  const remaining = Math.max(0, new Date(endAt).getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}天 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

export function HomeCountdown({ endAt }: { endAt: string }) {
  const [label, setLabel] = useState(() => formatRemaining(endAt));

  useEffect(() => {
    const update = () => setLabel(formatRemaining(endAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [endAt]);

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#E92D2D] px-2 py-1 text-[11px] font-black text-white shadow-sm">
      <Clock3 className="h-3 w-3" />
      {label}
    </span>
  );
}
