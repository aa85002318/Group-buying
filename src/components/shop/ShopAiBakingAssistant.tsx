"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, ShoppingCart, Sparkles, Star } from "lucide-react";
import {
  DEFAULT_AI_CHIPS,
  resolveAiRecommend,
  type ShopAiChip,
  type ShopAiRecommendBundle,
} from "@/lib/shop/ai-assistant";
import { cn } from "@/lib/utils";

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

/**
 * AI 烘焙助手 — shop hub block + floating CTA.
 */
export function ShopAiBakingAssistant({
  chips: chipsProp,
}: {
  chips?: ShopAiChip[];
}) {
  const router = useRouter();
  const [chips, setChips] = useState<ShopAiChip[]>(chipsProp ?? DEFAULT_AI_CHIPS);
  const [query, setQuery] = useState("");
  const [bundle, setBundle] = useState<ShopAiRecommendBundle | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (chipsProp) {
      setChips(chipsProp);
      return;
    }
    let cancelled = false;
    fetch("/api/shop/ai-chips", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d.chips) && d.chips.length) setChips(d.chips);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [chipsProp]);

  const runRecommend = (value: string) => {
    const q = value.trim();
    if (!q) return;
    setQuery(q);
    setBundle(resolveAiRecommend(q));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    runRecommend(query);
  };

  const activeChips = chips
    .filter((c) => c.is_active !== false)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <section className="shop-ai-assistant w-full" aria-label="AI 烘焙助手">
        <div className="shop-ai-assistant__panel mx-auto w-full max-w-[1440px] overflow-hidden rounded-[24px] px-4 py-6 md:px-6 md:py-8 xl:max-w-[1320px]">
          <div className="relative">
            <div className="pr-16 md:pr-28">
              <h2 className="text-[22px] font-bold leading-tight text-[#153E73] md:text-[26px]">
                ✨ AI 烘焙助手 👼
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#687386]">
                告訴我們你今天想做什麼？
                <br />
                AI 幫你推薦食譜、材料與工具！
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/shop/hero-mobile.jpg"
              alt=""
              className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 rounded-full object-cover object-top shadow-md ring-4 ring-white/70 md:h-28 md:w-28"
              aria-hidden
            />
          </div>

          <form onSubmit={onSubmit} className="shop-ai-assistant__search mt-5" role="search">
            <label className="sr-only" htmlFor="shop-ai-assistant-input">
              今天想做什麼
            </label>
            <input
              id="shop-ai-assistant-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="今天想做什麼呢？例如：想做生吐司、乳酪蛋糕、泡芙"
              className="shop-ai-assistant__input"
              autoComplete="off"
            />
            <button
              type="submit"
              className="shop-ai-assistant__submit"
              aria-label="送出 AI 推薦"
            >
              <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
          </form>

          <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => runRecommend(chip.prompt || chip.label)}
                className="shop-ai-chip shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#153E73] ring-1 ring-[#DCE8F5] transition hover:bg-[#FFE149] hover:ring-[#FFE149]"
              >
                {chip.emoji} {chip.label}
              </button>
            ))}
          </div>

          {bundle ? (
            <div className="mt-6 space-y-4">
              <h3 className="text-[15px] font-bold text-[#153E73]">AI 推薦結果</h3>

              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
                {bundle.recipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={recipe.href}
                    className="shop-ai-recipe-card group w-[72%] shrink-0 overflow-hidden rounded-[20px] bg-white shadow-[0_8px_22px_rgba(21,62,115,0.08)] transition hover:scale-[1.02] md:w-auto"
                  >
                    <div className="aspect-[5/4] overflow-hidden bg-[#EEF6FF]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-1.5 p-3">
                      <p className="line-clamp-1 text-[14px] font-bold text-[#153E73]">
                        {recipe.title}
                      </p>
                      <Stars value={recipe.rating} />
                      <p className="text-[11px] text-[#687386]">製作時間 {recipe.cook_time}</p>
                      <span className="inline-flex h-8 items-center justify-center rounded-full bg-[#153E73] px-3 text-[11px] font-bold text-white">
                        查看食譜
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[20px] bg-white p-4 shadow-[0_6px_18px_rgba(21,62,115,0.06)]">
                  <p className="text-[14px] font-bold text-[#153E73]">所需材料</p>
                  <div className="mt-3 flex gap-2">
                    {bundle.materials.slice(0, 4).map((m) => (
                      <Link
                        key={m.id}
                        href={m.href}
                        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#FFF8D6]"
                        aria-label={m.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.image_url} alt="" className="h-8 w-8 object-contain" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/shop"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#153E73]"
                  >
                    查看全部材料 <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>

                <div className="rounded-[20px] bg-white p-4 shadow-[0_6px_18px_rgba(21,62,115,0.06)]">
                  <p className="text-[14px] font-bold text-[#153E73]">建議工具</p>
                  <ul className="mt-3 space-y-1.5">
                    {bundle.tools.map((tool) => (
                      <li key={tool} className="text-[13px] text-[#687386]">
                        · {tool}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/shop"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#153E73]"
                  >
                    查看全部工具 <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>

                <div className="flex flex-col justify-between rounded-[20px] bg-white p-4 shadow-[0_6px_18px_rgba(21,62,115,0.06)]">
                  <div>
                    <p className="text-[14px] font-bold text-[#153E73]">可直接加入購物車</p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#687386]">
                      一鍵把推薦材料加入購物車，快速備齊今天的烘焙清單。
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#F16458] px-4 text-[13px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
                    onClick={() => {
                      setToast("已準備材料清單，前往分類挑選商品");
                      window.setTimeout(() => setToast(null), 2200);
                      router.push("/shop");
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" aria-hidden />
                    一鍵加入購物車
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {toast ? (
            <p className="mt-3 text-center text-[12px] font-medium text-[#153E73]" role="status">
              {toast}
            </p>
          ) : null}
        </div>
      </section>

      <Link
        href="/ai"
        className="shop-ai-fab"
        aria-label="今天想做什麼？開啟 AI 聊天"
      >
        <span className="shop-ai-fab__icon" aria-hidden>
          <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="shop-ai-fab__label">今天想做什麼？</span>
      </Link>
    </>
  );
}
