"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import type { BakingChallenge } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export function ChallengesHubClient() {
  const [items, setItems] = useState<BakingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/challenges")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.challenges ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-[#6B3F24]">烘焙挑戰</h1>
        <p className="mt-1 text-sm text-foreground-secondary">參加每月主題，分享你的烘焙作品</p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="home-skeleton aspect-[4/3] rounded-[20px]" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl bg-error-soft px-4 py-3 text-sm text-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-foreground-secondary">目前沒有進行中的挑戰</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/challenges/${c.slug}`}
              className="group overflow-hidden rounded-[20px] border border-[#F2D8BF] bg-[#FFF9EA] shadow-soft"
            >
              <div className="relative aspect-[16/10] bg-white">
                {c.cover_image_url ? (
                  <Image
                    src={c.cover_image_url}
                    alt=""
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <h2 className="font-bold text-[#6B3F24]">{c.title}</h2>
                {c.description ? (
                  <p className="line-clamp-2 text-sm text-foreground-secondary">{c.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-3 text-xs text-foreground-secondary">
                  {c.starts_at ? <span>{formatDate(c.starts_at)} 起</span> : null}
                  {c.participant_count > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {c.participant_count} 人
                    </span>
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
