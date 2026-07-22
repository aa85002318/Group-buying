"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { SeasonalTheme } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export function ThemesHubClient() {
  const [items, setItems] = useState<SeasonalTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/themes")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.themes ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-[#6B3F24]">季節主題企劃</h1>
        <p className="mt-1 text-sm text-foreground-secondary">依季節探索烘焙靈感與精選企劃</p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-skeleton aspect-[3/4] rounded-[22px]" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl bg-error-soft px-4 py-3 text-sm text-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-foreground-secondary">目前沒有季節主題</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/themes/${t.slug}`}
              className="group relative overflow-hidden rounded-[22px] border border-[#F2D8BF] bg-white shadow-soft"
            >
              <div className="relative aspect-[3/4] bg-[#FFF9EA]">
                {(t.cover_image_url || t.mobile_cover_image_url) ? (
                  <Image
                    src={t.cover_image_url || t.mobile_cover_image_url || ""}
                    alt=""
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-full items-end p-4"
                    style={{ backgroundColor: t.theme_color ?? "#FFF9EA" }}
                  >
                    <span className="text-lg font-black text-[#6B3F24]">{t.title}</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 pt-10">
                  <h2 className="font-bold text-white">{t.title}</h2>
                  {t.starts_at ? (
                    <p className="mt-1 text-xs text-white/85">{formatDate(t.starts_at)} 起</p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
