"use client";

import { useEffect, useState } from "react";
import type { HomepageBlock } from "@/lib/types/database";
import { resolveHomeBlock } from "@/lib/home/blocks";
import {
  DEFAULT_QUICK_SERVICES_SETTINGS,
  parseQuickServicesSettings,
  type HomeQuickServicesSettings,
} from "@/types/home-quick-service";
import { QuickServicesHeader } from "@/components/home/QuickServicesHeader";
import { QuickServicesCarousel } from "@/components/home/QuickServicesCarousel";
import { MemberCenterCard } from "@/components/home/MemberCenterCard";

/** Homepage common services — circular icons carousel + member center. */
export function HomeQuickServicesSection() {
  const [settings, setSettings] = useState<HomeQuickServicesSettings>(
    DEFAULT_QUICK_SERVICES_SETTINGS
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cms", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        const blocks = (json.blocks ?? []) as HomepageBlock[];
        const block = resolveHomeBlock(blocks, "quick_entry");
        const cfg = parseQuickServicesSettings(block.config);
        const row = blocks.find((b) => b.block_key === "quick_entry");
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
      className="home-quick-services-section w-full bg-[#FFFEFA] px-4 py-6 md:px-6 md:py-8"
      aria-label={settings.title}
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <QuickServicesHeader settings={settings} />
        <QuickServicesCarousel items={settings.items} />
        <div className="mt-4 md:mt-5">
          <MemberCenterCard settings={settings} />
        </div>
      </div>
    </section>
  );
}
