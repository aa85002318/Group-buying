"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Video } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { mockVideos } from "@/lib/mock-data";

const VIDEO_CATEGORIES = [
  { value: "", label: "全部" },
  { value: "一分鐘教你做", label: "一分鐘教你做" },
  { value: "完整教學", label: "完整教學" },
  { value: "直播回放", label: "直播回放" },
  { value: "烘焙技巧", label: "烘焙技巧" },
  { value: "老師專欄", label: "老師專欄" },
];

function durationLabel(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideosPageClient() {
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    fetch(`/api/videos?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        if (d.videos) setVideos(d.videos);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-caramel">烘焙影音</h1>
        <p className="mt-1 text-sm text-foreground-secondary">短影音、完整教學與直播回放</p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VIDEO_CATEGORIES.map((c) => (
          <button
            key={c.value || "all"}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              category === c.value
                ? "bg-primary text-white"
                : "border border-border-soft bg-surface text-caramel"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[18px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
          {error}
          <button type="button" className="ml-2 underline" onClick={load}>
            重試
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-[18px] bg-surface p-10 text-center text-sm text-foreground-secondary">
          目前沒有影音
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((v) => {
            const href = `/videos/${v.slug || v.id}`;
            const dur = durationLabel(v.duration_seconds);
            return (
              <Link
                key={v.id}
                href={href}
                className="overflow-hidden rounded-[18px] border border-border-soft bg-surface shadow-[0_2px_8px_rgba(74,49,36,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(74,49,36,0.08)]"
              >
                <div className="relative aspect-video bg-surface-soft">
                  {v.thumbnail_url ? (
                    <Image src={v.thumbnail_url} alt={v.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-foreground-secondary">
                      影音
                    </div>
                  )}
                  {dur && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">
                      {dur}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  {v.category && (
                    <p className="text-[11px] font-medium text-caramel">{v.category}</p>
                  )}
                  <p className="mt-0.5 line-clamp-2 font-semibold text-foreground">{v.title}</p>
                  <p className="mt-1 text-xs text-foreground-secondary">
                    {v.published_at || v.created_at
                      ? formatDate(v.published_at || v.created_at)
                      : ""}
                    {v.view_count != null ? ` · ${v.view_count} 次觀看` : ""}
                  </p>
                  <p className="mt-2 text-sm font-medium text-primary">觀看 →</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
