"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  DEFAULT_LATEST_CAMPAIGN_SETTINGS,
  type HomeLatestCampaignSettings,
} from "@/types/home-latest-campaign";
import { LatestCampaignCarousel } from "./LatestCampaignCarousel";

/**
 * 「最新活動」Banner 輪播 — below search, above 常用服務.
 * Fixed 5:2 slides with ~12% side peek; images CMS-ready via settings.
 */
export function HomeLatestCampaignSection({
  settings = DEFAULT_LATEST_CAMPAIGN_SETTINGS,
}: {
  settings?: HomeLatestCampaignSettings;
}) {
  if (!settings.enabled) return null;

  return (
    <section
      className="latest-campaign-section"
      aria-label={settings.title || "最新活動"}
    >
      <div className="latest-campaign-inner">
        <header className="latest-campaign-header">
          <h2 className="latest-campaign-title">
            {settings.title}
            <span className="latest-campaign-emoji" aria-hidden>
              {" "}
              🎉
            </span>
          </h2>
          <Link href={settings.viewAllHref} className="latest-campaign-more">
            {settings.viewAllLabel}
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </header>
        <LatestCampaignCarousel settings={settings} />
      </div>
    </section>
  );
}
