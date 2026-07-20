"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock3 } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import type { Article } from "@/lib/types/database";
import { mockArticles } from "@/lib/mock-data";

function readingMinutes(content: string | null | undefined) {
  const chars = (content ?? "").replace(/<[^>]+>/g, "").length;
  return Math.max(1, Math.ceil(chars / 400));
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>(
    mockArticles.filter((a) => a.status === "published")
  );
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("全部");

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) => {
        if (d.articles?.length) setArticles(d.articles.filter((a: Article) => a.status === "published"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of articles) {
      if (a.product_categories?.name) set.add(a.product_categories.name);
    }
    return ["全部", ...Array.from(set)];
  }, [articles]);

  const filtered = useMemo(() => {
    if (category === "全部") return articles;
    return articles.filter((a) => a.product_categories?.name === category);
  }, [articles, category]);

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="text-xl font-black text-foreground">文章中心</h1>
        <p className="mt-1 text-sm text-foreground-secondary">烘焙知識 · 食譜分享 · 生活靈感</p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)} tone="mint">
            {c}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[20px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-foreground-secondary">尚無已發布文章</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((a) => (
            <Link key={a.id} href={`/articles/${a.slug}`} className="card-lift overflow-hidden">
              <div className="relative aspect-[16/9] bg-muted">
                {a.cover_image ? (
                  <Image src={a.cover_image} alt={a.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center bg-mint-gradient text-sm font-bold text-white">
                    CHIMEIDIY
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                {a.product_categories?.name && (
                  <span className="text-[11px] font-bold text-success">{a.product_categories.name}</span>
                )}
                <h2 className="line-clamp-2 font-bold text-foreground">{a.title}</h2>
                <p className="flex items-center gap-1 text-xs text-foreground-secondary">
                  <Clock3 className="h-3.5 w-3.5" />
                  約 {readingMinutes(a.content)} 分鐘 ·{" "}
                  {new Date(a.created_at).toLocaleDateString("zh-TW")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
