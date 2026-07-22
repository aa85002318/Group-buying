"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { SeasonalTheme } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export function ThemeDetailClient({ slug }: { slug: string }) {
  const [theme, setTheme] = useState<SeasonalTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/themes/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setTheme(d.theme);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="home-skeleton h-10 w-2/3 rounded" />
        <div className="home-skeleton aspect-[16/9] rounded-[22px]" />
      </div>
    );
  }

  if (error || !theme) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-foreground-secondary">{error ?? "找不到主題"}</p>
        <Link href="/themes" className="text-sm text-primary hover:underline">
          返回主題列表
        </Link>
      </div>
    );
  }

  const cover = theme.cover_image_url || theme.mobile_cover_image_url;

  return (
    <article className="page-enter mx-auto max-w-3xl space-y-6 pb-8">
      <Link href="/themes" className="text-sm font-medium text-primary hover:underline">
        ← 返回主題列表
      </Link>

      {cover ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] bg-muted">
          <Image src={cover} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div
          className="flex aspect-[16/9] items-center justify-center rounded-[22px]"
          style={{ backgroundColor: theme.theme_color ?? "#FFF9EA" }}
        >
          <h1 className="text-3xl font-black text-[#6B3F24]">{theme.title}</h1>
        </div>
      )}

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[#6B3F24] md:text-3xl">{theme.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-foreground-secondary">
          {theme.starts_at ? <span>開始 {formatDate(theme.starts_at)}</span> : null}
          {theme.ends_at ? <span>結束 {formatDate(theme.ends_at)}</span> : null}
        </div>
      </header>

      {theme.description ? (
        <section className="rounded-[20px] border border-[#F2D8BF] bg-[#FFF9EA] p-5">
          <h2 className="font-bold text-[#6B3F24]">主題介紹</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
            {theme.description}
          </p>
        </section>
      ) : null}
    </article>
  );
}
