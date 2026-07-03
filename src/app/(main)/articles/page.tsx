"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types/database";
import { mockArticles } from "@/lib/mock-data";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>(
    mockArticles.filter((a) => a.status === "published")
  );

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) => {
        if (d.articles?.length) setArticles(d.articles);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-coffee">文章專區</h1>
        <p className="text-sm text-muted-foreground">團購攻略與生活分享</p>
      </div>

      {articles.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">尚無已發布文章</p>
      ) : (
        <div className="space-y-4">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.slug}`}
              className="flex gap-4 rounded-xl bg-white p-4 shadow-card transition-shadow hover:shadow-lg"
            >
              {a.cover_image && (
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                  <Image src={a.cover_image} alt={a.title} fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-medium text-coffee">{a.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
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
