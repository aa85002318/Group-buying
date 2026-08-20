"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SHOP_HOME_SETTINGS,
  mascotHeightClass,
  type ShopHomeSettings,
  type ShopPopularKeyword,
} from "@/lib/shop/home-settings";
import { cn } from "@/lib/utils";
import { ShopSearchBar } from "@/components/shop/ShopSearchBar";
import { ShopPopularKeywords } from "@/components/shop/ShopPopularKeywords";

/**
 * IP welcome band under the shop header — CMS-driven mascot, copy, search, tags.
 * No hardcoded character art. Missing mascot → copy goes full-width.
 */
export function ShopWelcomeSection({
  backgroundColor,
}: {
  backgroundColor?: string;
}) {
  const [settings, setSettings] = useState<ShopHomeSettings>(DEFAULT_SHOP_HOME_SETTINGS);
  const [keywords, setKeywords] = useState<ShopPopularKeyword[]>([]);
  const [mascotFailed, setMascotFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop/home-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.settings) setSettings(d.settings as ShopHomeSettings);
        if (Array.isArray(d.keywords)) setKeywords(d.keywords as ShopPopularKeyword[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const bg = backgroundColor || settings.welcome_background_color;
  const mascotUrl = !mascotFailed ? settings.mascot_image_url?.trim() || null : null;
  const showWelcome = settings.show_welcome_section;
  const showMascot = Boolean(mascotUrl);
  const reverse = settings.mascot_position === "right";
  const centered = settings.mascot_position === "center";
  const liveDecorations = settings.decorations.filter((d) => d.enabled && d.url);

  return (
    <section
      className="shop-welcome relative w-full overflow-hidden"
      style={{ backgroundColor: bg }}
      aria-label="商城歡迎區"
    >
      {showWelcome ? (
        <div className="relative mx-auto w-full max-w-[1200px] px-4 md:px-6">
          {liveDecorations.map((d, i) => (
            <img
              key={`${d.url}-${i}`}
              src={d.url!}
              alt=""
              aria-hidden
              className="pointer-events-none absolute z-[1] object-contain"
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: d.size,
                height: d.size,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          <div
            className={cn(
              "relative z-[2] flex min-h-[190px] items-end gap-2 pb-3 pt-1 md:min-h-[220px] md:gap-6 md:pb-4",
              reverse && "flex-row-reverse",
              centered && "flex-col items-center justify-end text-center"
            )}
          >
            {showMascot ? (
              <div
                className={cn(
                  "flex shrink-0 items-end justify-center self-end",
                  centered ? "w-full max-w-[220px]" : "w-[38%] max-w-[180px] md:w-[40%] md:max-w-[220px]"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mascotUrl!}
                  alt={settings.mascot_alt || "CHIMEiDIY"}
                  className={cn(
                    "pointer-events-none select-none object-contain object-bottom",
                    mascotHeightClass(settings.mascot_size),
                    "-mb-1 translate-y-[6px] md:translate-y-[8px]"
                  )}
                  onError={() => setMascotFailed(true)}
                />
              </div>
            ) : null}

            <div
              className={cn(
                "min-w-0 pb-2",
                showMascot && !centered ? "flex-1" : "w-full",
                !showMascot && "text-left",
                centered && "text-center"
              )}
            >
              {settings.welcome_eyebrow ? (
                <p className="text-[13px] font-medium leading-tight text-[#153E73] md:text-sm">
                  {settings.welcome_eyebrow}
                </p>
              ) : null}
              <h2 className="mt-0.5 text-[22px] font-extrabold leading-tight tracking-wide text-[#153E73] md:text-[28px]">
                {settings.welcome_title}
              </h2>
              {settings.welcome_subtitle ? (
                <p className="mt-1.5 max-w-[18em] whitespace-pre-line text-[14px] font-medium leading-snug text-[#153E73] md:max-w-none md:text-base">
                  {settings.welcome_subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-2" />
      )}

      <div className="relative z-[3] mx-auto w-full max-w-[1200px] px-4 pb-3 md:px-6 md:pb-4">
        <ShopSearchBar placeholder={settings.search_placeholder} seam={false} />
        {settings.show_popular_keywords ? (
          <ShopPopularKeywords keywords={keywords} />
        ) : null}
      </div>
    </section>
  );
}
