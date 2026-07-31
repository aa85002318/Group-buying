"use client";

import { useEffect, useState } from "react";
import type { HomepageBlock } from "@/lib/types/database";
import { resolveHomeBlock } from "@/lib/home/blocks";
import {
  DEFAULT_GROUP_BUY_BANNER_SETTINGS,
  parseGroupBuyBannerSettings,
  type HomeGroupBuyBannerSettings,
} from "@/types/home-group-buy-banner";
import { GroupBuyBannerTiles } from "./GroupBuyBannerTiles";
import { GroupBuyBannerBenefits } from "./GroupBuyBannerBenefits";

/** 團購四格粉筆 Banner — sits under「一鍵買齊材料」, above 團購專區. */
export function HomeGroupBuyBannerSection() {
  const [settings, setSettings] = useState<HomeGroupBuyBannerSettings>(
    DEFAULT_GROUP_BUY_BANNER_SETTINGS
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cms", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        const blocks = (json.blocks ?? []) as HomepageBlock[];
        const block = resolveHomeBlock(blocks, "group_buy_banner");
        const cfg = parseGroupBuyBannerSettings(block.config);
        const row = blocks.find((b) => b.block_key === "group_buy_banner");
        const visible = (row ? row.is_visible !== false : true) && cfg.enabled !== false;
        setSettings({ ...cfg, enabled: visible });
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings.enabled) return null;

  return (
    <section
      className="group-buy-banner-section"
      aria-label={settings.title || "團購分類"}
    >
      <div className="group-buy-banner-inner">
        <GroupBuyBannerTiles settings={settings} />
        <GroupBuyBannerBenefits benefits={settings.benefits} />
      </div>
    </section>
  );
}
