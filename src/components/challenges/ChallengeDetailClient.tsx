"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import type { BakingChallenge } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export function ChallengeDetailClient({ slug }: { slug: string }) {
  const [challenge, setChallenge] = useState<BakingChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/challenges/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setChallenge(d.challenge);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="home-skeleton h-10 w-2/3 rounded" />
        <div className="home-skeleton aspect-[16/9] rounded-[20px]" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-foreground-secondary">{error ?? "找不到挑戰"}</p>
        <Link href="/challenges" className="text-sm text-primary hover:underline">
          返回挑戰列表
        </Link>
      </div>
    );
  }

  return (
    <article className="page-enter mx-auto max-w-3xl space-y-6 pb-8">
      <Link href="/challenges" className="text-sm font-medium text-primary hover:underline">
        ← 返回挑戰列表
      </Link>

      {challenge.cover_image_url ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] bg-muted">
          <Image
            src={challenge.cover_image_url}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[#6B3F24] md:text-3xl">{challenge.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-foreground-secondary">
          {challenge.starts_at ? <span>開始 {formatDate(challenge.starts_at)}</span> : null}
          {challenge.ends_at ? <span>截止 {formatDate(challenge.ends_at)}</span> : null}
          {challenge.participant_count > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" aria-hidden />
              {challenge.participant_count} 人參加
            </span>
          ) : null}
        </div>
      </header>

      {challenge.description ? (
        <section className="rounded-[20px] border border-[#F2D8BF] bg-[#FFF9EA] p-5">
          <h2 className="font-bold text-[#6B3F24]">挑戰介紹</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
            {challenge.description}
          </p>
        </section>
      ) : null}

      {challenge.rules ? (
        <section className="rounded-[20px] border border-[#F2D8BF] bg-white p-5">
          <h2 className="font-bold text-[#6B3F24]">活動規則</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
            {challenge.rules}
          </p>
        </section>
      ) : null}
    </article>
  );
}
