"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import {
  buildAiAssistantHref,
  DEFAULT_AI_ASSISTANT_SETTINGS,
  type ShopAiAssistantSettings,
  type ShopAiAssistantTag,
} from "@/lib/shop/ai-recipe-assistant";
import { cn } from "@/lib/utils";

const FLOAT_DECOS = [
  { emoji: "⭐", className: "left-[8%] top-[12%] text-[18px] rotate-[-12deg]" },
  { emoji: "❤️", className: "left-[22%] top-[8%] text-[14px] rotate-[10deg]" },
  { emoji: "🍪", className: "left-[6%] top-[42%] text-[16px] rotate-[8deg]" },
  { emoji: "🥛", className: "left-[28%] bottom-[28%] text-[15px] rotate-[-6deg]" },
  { emoji: "🍓", className: "left-[10%] bottom-[18%] text-[16px] rotate-[14deg]" },
  { emoji: "🍥", className: "left-[32%] top-[36%] text-[14px] rotate-[-18deg]" },
] as const;

/**
 * Version A｜AI 食譜助手 — brand feature card (not a chat UI).
 */
export function ShopAiRecipeAssistant({
  settings: settingsProp,
}: {
  settings?: ShopAiAssistantSettings;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<ShopAiAssistantSettings>(
    settingsProp ?? DEFAULT_AI_ASSISTANT_SETTINGS
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (settingsProp) {
      setSettings(settingsProp);
      return;
    }
    let cancelled = false;
    fetch("/api/shop/ai-assistant", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.settings) return;
        setSettings(d.settings as ShopAiAssistantSettings);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [settingsProp]);

  if (!settings.is_visible) return null;

  const tags = settings.popular_tags
    .filter((t) => t.is_active !== false)
    .sort((a, b) => a.sort_order - b.sort_order);

  const goAsk = (value?: string) => {
    const q = (value ?? query).trim();
    router.push(buildAiAssistantHref(settings.cta_href, q));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    goAsk();
  };

  const onTag = (tag: ShopAiAssistantTag) => {
    setQuery(tag.prompt);
    goAsk(tag.prompt);
  };

  const titleLines = settings.title.split("\n");

  return (
    <section className="shop-ai-recipe-assistant w-full px-4 md:px-6" aria-label="AI 食譜助手">
      <div
        className={cn(
          "shop-ai-recipe-assistant__card relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-[rgba(255,220,120,0.35)] p-6 md:p-8"
        )}
        style={{
          background: `linear-gradient(180deg, ${settings.background_color} 0%, #FFF3CF 100%)`,
          boxShadow: "0 18px 40px rgba(255, 195, 60, 0.12)",
        }}
      >
        {settings.background_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.background_image_url}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
            aria-hidden
          />
        ) : null}

        {/* Soft glows */}
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FFE58A]/55 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/70 blur-3xl"
          aria-hidden
        />
        <span className="pointer-events-none absolute right-[18%] top-[16%] text-white/70 text-[12px]" aria-hidden>
          ✦
        </span>
        <span className="pointer-events-none absolute right-[8%] top-[38%] text-white/55 text-[10px]" aria-hidden>
          ✦
        </span>
        <span className="pointer-events-none absolute right-[28%] bottom-[22%] text-white/60 text-[11px]" aria-hidden>
          ✦
        </span>

        <div className="relative z-[1] grid gap-6 md:grid-cols-[35%_65%] md:items-end md:gap-8">
          {/* Left — IP */}
          <div className="relative order-1 flex min-h-[200px] items-end justify-center md:order-none md:min-h-[260px] md:justify-start md:pl-2 md:pb-1">
            {FLOAT_DECOS.map((d) => (
              <span
                key={d.emoji + d.className}
                className={cn(
                  "pointer-events-none absolute opacity-70 select-none",
                  d.className
                )}
                aria-hidden
              >
                {d.emoji}
              </span>
            ))}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.ip_image_url}
              alt=""
              className="relative z-[1] h-[200px] w-auto max-w-[88%] object-contain object-bottom drop-shadow-[0_12px_24px_rgba(21,62,115,0.12)] md:h-[240px] lg:h-[250px]"
            />
          </div>

          {/* Right — copy + search */}
          <div className="order-2 flex min-w-0 flex-col md:order-none md:pb-2">
            <h2 className="text-center text-[28px] font-extrabold leading-[1.2] text-[#153E73] md:text-left md:text-[40px]">
              {titleLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-3 text-center text-[15px] leading-[1.7] text-[#556070] md:mt-4 md:text-left md:text-[18px]">
              {settings.subtitle}
            </p>

            <form
              onSubmit={onSubmit}
              role="search"
              aria-label="AI 食譜搜尋"
              className={cn(
                "mt-5 flex h-[60px] w-full items-center gap-2 rounded-full border border-[#F3E3A3] bg-white px-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition duration-[250ms] md:mt-6 md:h-[72px] md:gap-3 md:px-4",
                "hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)]"
              )}
            >
              <Search
                className="ml-1 h-5 w-5 shrink-0 text-[#153E73]/70 md:h-6 md:w-6"
                strokeWidth={1.75}
                aria-hidden
              />
              <label className="sr-only" htmlFor="shop-ai-recipe-input">
                告訴 AI 你想做什麼
              </label>
              <input
                id="shop-ai-recipe-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={settings.placeholder}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#153E73] outline-none placeholder:text-[#8A94A3] md:text-[16px]"
                autoComplete="off"
              />
              <button
                type="submit"
                className="inline-flex h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#FDBB2D] px-4 text-[14px] font-bold text-white transition duration-[250ms] hover:bg-[#F8AE00] md:h-[52px] md:px-6 md:text-[15px]"
              >
                {settings.cta_text}
                <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </button>
            </form>

            {tags.length ? (
              <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onTag(tag)}
                    className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#F6E6B5] bg-white px-[18px] text-[13px] font-semibold text-[#153E73] transition duration-[250ms] hover:scale-[1.03] hover:bg-[#FFF0C7]"
                  >
                    {tag.emoji ? <span className="mr-1.5">{tag.emoji}</span> : null}
                    {tag.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
