"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DesktopActivities } from "@/components/desktop/DesktopActivities";
import { DesktopV2Gate } from "@/components/desktop/DesktopV2Gate";
import type { Article } from "@/lib/types/database";

function MobileActivities() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) =>
        setArticles((d.articles ?? []).filter((a: Article) => a.status === "published"))
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 p-[15px] pb-8">
      <h1 className="text-xl font-bold text-[#153E73]">最新活動</h1>
      {loading ? (
        <p className="text-sm text-[#687386]">載入中…</p>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={a.slug ? `/articles/${a.slug}` : `/articles/${a.id}`}
              className="flex gap-3 overflow-hidden rounded-2xl border border-[#E9EDF2] bg-white"
            >
              <div className="relative h-24 w-28 shrink-0 bg-[#EEF8FC]">
                {a.cover_image ? (
                  <Image src={a.cover_image} alt="" fill className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 py-3 pr-3">
                <p className="line-clamp-2 text-sm font-bold text-[#153E73]">{a.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivitiesPageClient() {
  return <DesktopV2Gate mobile={<MobileActivities />} desktop={<DesktopActivities />} />;
}
