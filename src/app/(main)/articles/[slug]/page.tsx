"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types/database";
import { mockArticles } from "@/lib/mock-data";

export default function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const [article, setArticle] = useState<Article | null>(
    mockArticles.find((a) => a.slug === params.slug && a.status === "published") ?? null
  );

  useEffect(() => {
    fetch(`/api/articles/${params.slug}`)
      .then((r) => r.json())
      .then((d) => d.article && setArticle(d.article))
      .catch(() => {});
  }, [params.slug]);

  if (!article) return <p>載入中…</p>;

  return (
    <article className="space-y-4">
      <Link href="/articles" className="text-sm text-primary">← 返回文章列表</Link>
      {article.cover_image && (
        <div className="relative aspect-video overflow-hidden rounded-2xl">
          <Image src={article.cover_image} alt={article.title} fill className="object-cover" unoptimized />
        </div>
      )}
      <h1 className="text-xl font-bold text-coffee">{article.title}</h1>
      <p className="text-xs text-muted-foreground">
        {new Date(article.created_at).toLocaleDateString("zh-TW")}
      </p>
      <div
        className="prose prose-sm max-w-none text-coffee"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
