"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types/database";
import { mockArticles } from "@/lib/mock-data";
import { getBrandFont } from "@/lib/branding";
import { brandFontIdsInHtml, brandGoogleFontsHref } from "@/lib/branding/fonts";
import { RichTextHtml } from "@/components/cms/RichTextHtml";
import { cleanRichTextHtml } from "@/lib/cms/safeHtml";

function ensureArticleFonts(
  titleFont?: string | null,
  bodyFont?: string | null,
  contentHtml?: string | null
) {
  const fromContent = brandFontIdsInHtml(contentHtml ?? "");
  const href = brandGoogleFontsHref([titleFont, bodyFont, ...fromContent]);
  if (!href) return;
  const id = "article-google-fonts";
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}

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

  useEffect(() => {
    if (!article) return;
    ensureArticleFonts(article.title_font, article.body_font, article.content);
  }, [article]);

  if (!article) return <p>載入中…</p>;

  const titleFamily = article.title_font ? getBrandFont(article.title_font).family : undefined;
  const bodyFamily = article.body_font ? getBrandFont(article.body_font).family : undefined;
  const content = cleanRichTextHtml(article.content);

  return (
    <article className="space-y-4">
      <Link href="/articles" className="text-sm text-primary">← 返回文章列表</Link>
      {article.cover_image && (
        <div className="relative aspect-video overflow-hidden rounded-2xl">
          <Image src={article.cover_image} alt={article.title} fill className="object-cover" unoptimized />
        </div>
      )}
      <h1
        className="text-xl font-bold text-coffee"
        style={titleFamily ? { fontFamily: titleFamily } : undefined}
      >
        {article.title}
      </h1>
      <p className="text-xs text-muted-foreground">
        {new Date(article.created_at).toLocaleDateString("zh-TW")}
      </p>
      <div style={bodyFamily ? { fontFamily: bodyFamily } : undefined}>
        <RichTextHtml html={content} className="max-w-none text-coffee" />
      </div>
    </article>
  );
}
