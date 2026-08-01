"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Star } from "lucide-react";
import {
  INSPIRATION_TAGS,
  aspectToRowSpan,
  type InspirationCategory,
  type ShopInspirationPost,
  DEFAULT_INSPIRATION_POSTS,
} from "@/lib/shop/inspiration";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[#F5A623]" aria-label={`${value} 星`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-3 w-3", i < value ? "fill-current" : "opacity-25")}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="h-6 w-6 rounded-full object-cover" />;
  }
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE149] text-[10px] font-bold text-[#153E73]"
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

function InspirationCard({ post }: { post: ShopInspirationPost }) {
  const span = aspectToRowSpan(post.aspect, post.card_type);
  const aspectClass =
    post.aspect === "1/1"
      ? "aspect-square"
      : post.aspect === "4/5"
        ? "aspect-[4/5]"
        : "aspect-[3/4]";

  return (
    <article
      className="shop-inspiration-card group relative flex flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_8px_24px_rgba(21,62,115,0.08)] transition duration-200 hover:scale-[1.02]"
      style={{ gridRowEnd: `span ${span}` }}
    >
      <button
        type="button"
        className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#F16458] shadow-sm backdrop-blur"
        aria-label={`收藏 ${post.title}`}
      >
        <Heart className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>

      {post.card_type === "teacher" ? (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-[#7C5CFF] px-2 py-0.5 text-[10px] font-bold text-white">
          老師作品
        </span>
      ) : null}

      <Link href={post.href} className="block min-h-0 flex-1">
        <div className={cn("relative w-full overflow-hidden bg-[#FFF8D6]", aspectClass)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#153E73]">
            {post.title}
          </h3>

          {post.card_type === "community" ? (
            <>
              <div className="flex items-center gap-1.5">
                <Avatar name={post.author_name} src={post.author_avatar} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-[#153E73]">{post.author_name}</p>
                  {post.time_label ? (
                    <p className="text-[10px] text-[#687386]">{post.time_label}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#687386]">
                <span className="inline-flex items-center gap-0.5">
                  <Heart className="h-3 w-3 text-[#F16458]" aria-hidden />
                  {post.likes}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <MessageCircle className="h-3 w-3" aria-hidden />
                  {post.comments}
                </span>
              </div>
              {post.materials.length ? (
                <p className="line-clamp-2 text-[10px] leading-relaxed text-[#687386]">
                  使用材料：{post.materials.join("、")}
                </p>
              ) : null}
            </>
          ) : null}

          {post.card_type === "teacher" ? (
            <>
              <p className="text-[12px] font-medium text-[#153E73]">{post.author_name}</p>
              <span className="mt-1 inline-flex h-8 items-center justify-center rounded-full bg-[#153E73] px-3 text-[11px] font-bold text-white">
                查看完整教學
              </span>
            </>
          ) : null}

          {post.card_type === "recipe" ? (
            <>
              {post.cook_time ? (
                <p className="text-[11px] text-[#687386]">完成時間 {post.cook_time}</p>
              ) : null}
              {post.difficulty ? (
                <p className="text-[11px] text-[#687386]">難度 {post.difficulty}</p>
              ) : null}
              <Stars value={post.rating} />
              <span className="mt-1 inline-flex h-8 items-center justify-center rounded-full border border-[#153E73]/20 bg-[#FFF8D6] px-3 text-[11px] font-bold text-[#153E73]">
                查看食譜
              </span>
            </>
          ) : null}

          {post.card_type === "tip" ? (
            <>
              {post.tip_body ? (
                <p className="line-clamp-3 text-[11px] leading-relaxed text-[#687386]">{post.tip_body}</p>
              ) : null}
              <Stars value={post.rating} />
              {post.product_name && post.product_href ? (
                <span className="mt-1 text-[11px] font-bold text-[#F16458]">
                  使用商品：{post.product_name}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

/**
 * 烘焙靈感牆 — CSS Grid masonry (no third-party lib).
 */
export function ShopInspirationWall({
  posts: postsProp,
}: {
  posts?: ShopInspirationPost[];
}) {
  const [posts, setPosts] = useState<ShopInspirationPost[]>(
    postsProp ?? DEFAULT_INSPIRATION_POSTS
  );
  const [tag, setTag] = useState<InspirationCategory>("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (postsProp) {
      setPosts(postsProp);
      return;
    }
    let cancelled = false;
    fetch("/api/shop/inspiration", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d.posts) && d.posts.length) setPosts(d.posts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [postsProp]);

  const filtered = useMemo(() => {
    const list = posts
      .filter((p) => p.is_active !== false)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (tag === "all") return list;
    return list.filter((p) => p.category === tag);
  }, [posts, tag]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [tag]);

  return (
    <section className="shop-inspiration-wall w-full" aria-label="烘焙靈感牆">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 xl:max-w-[1320px]">
        <header className="mb-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-tight text-[#153E73] md:text-[26px]">
              ✨ 烘焙靈感牆
            </h2>
            <p className="mt-1 text-[13px] text-[#687386]">看看大家今天烤了什麼 ❤️</p>
          </div>
          <Link
            href="/recipes"
            className="mt-1 shrink-0 text-[14px] font-bold text-[#153E73] transition hover:opacity-75"
          >
            探索更多 &gt;
          </Link>
        </header>

        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          role="tablist"
          aria-label="靈感分類"
        >
          {INSPIRATION_TAGS.map((t) => {
            const active = tag === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTag(t.id)}
                className={cn(
                  "shop-inspiration-chip shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition",
                  active
                    ? "bg-[#FFE149] text-[#153E73]"
                    : "bg-white text-[#153E73] ring-1 ring-[#E8ECF2] hover:bg-[#FFE149]"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="shop-inspiration-masonry">
          {visible.map((post) => (
            <InspirationCard key={post.id} post={post} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2" aria-label="靈感牆分頁">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 頁`}
              aria-current={i === safePage ? "true" : undefined}
              onClick={() => setPage(i)}
              className={cn(
                "h-2 rounded-full transition",
                i === safePage ? "w-5 bg-[#153E73]" : "w-2 bg-[#D5DBE5]"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
