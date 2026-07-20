"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { externalLinkProps } from "@/lib/cms/safeHtml";
import type { NewsPost } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NewsDetailClient({ slug }: { slug: string }) {
  const [post, setPost] = useState<NewsPost | null>(null);
  const [related, setRelated] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setPost(d.post);
        setRelated(d.related ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-[18px] bg-muted" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-foreground-secondary">{error ?? "找不到資訊"}</p>
        <Link href="/news" className="text-sm text-primary hover:underline">
          返回最新資訊
        </Link>
      </div>
    );
  }

  const tone = post.is_important
    ? "bg-error-soft text-error"
    : post.news_categories?.slug === "system"
      ? "bg-info-soft text-info"
      : post.news_categories?.slug === "closure"
        ? "bg-warning-soft text-warning"
        : "bg-primary-soft text-primary";

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/news/${post.slug}`;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-3 py-1 text-xs font-medium", tone)}>
          {post.news_categories?.name ?? "資訊"}
        </span>
        {post.is_featured && (
          <span className="rounded-full bg-info-soft px-3 py-1 text-xs font-medium text-info">置頂</span>
        )}
        {post.is_important && (
          <span className="rounded-full bg-error-soft px-3 py-1 text-xs font-medium text-error">重要</span>
        )}
      </div>

      <h1 className="text-2xl font-bold text-caramel md:text-3xl">{post.title}</h1>
      <p className="text-sm text-foreground-secondary">
        {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
      </p>

      {post.summary && <p className="text-base text-foreground-secondary">{post.summary}</p>}

      {post.content ? (
        <div
          className="prose prose-sm max-w-none text-foreground [&_a]:text-primary"
          // Content is sanitized on the API
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      ) : null}

      {post.related_url && (
        <a
          href={post.related_url}
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
          {...externalLinkProps(post.related_url)}
        >
          相關連結 →
        </a>
      )}

      <button
        type="button"
        className="min-h-11 rounded-2xl border border-border-soft bg-surface px-4 text-sm font-medium text-caramel"
        onClick={() => {
          if (navigator.share) navigator.share({ title: post.title, url: shareUrl }).catch(() => {});
          else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
            alert("已複製連結");
          }
        }}
      >
        分享
      </button>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-caramel">相關資訊</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/news/${r.slug}`} className="text-sm font-medium text-primary hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
