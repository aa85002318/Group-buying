"use client";

import { useEffect, useMemo, useState } from "react";
import type { HomepageBlock } from "@/lib/types/database";
import { resolveHomeBlock } from "@/lib/home/blocks";
import {
  DEFAULT_MEMBER_SHORTCUTS,
  DEFAULT_QUICK_ENTRY_CARDS,
  listVisibleQuickEntryCards,
  parseQuickEntryConfig,
} from "@/types/home-quick-entry";
import { QuickEntryCard } from "./QuickEntryCard";
import { MemberCenterCard } from "./MemberCenterCard";
import { cn } from "@/lib/utils";

/** Homepage function entry grid — no section title. */
export function HomeQuickEntrySection() {
  const [enabled, setEnabled] = useState(true);
  const [cards, setCards] = useState(DEFAULT_QUICK_ENTRY_CARDS);
  const [shortcuts, setShortcuts] = useState(DEFAULT_MEMBER_SHORTCUTS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cms", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        const blocks = (json.blocks ?? []) as HomepageBlock[];
        const block = resolveHomeBlock(blocks, "quick_entry");
        const cfg = parseQuickEntryConfig(block.config);
        const row = blocks.find((b) => b.block_key === "quick_entry");
        setEnabled((row ? row.is_visible !== false : true) && cfg.enabled !== false);
        setCards(cfg.cards?.length ? cfg.cards : DEFAULT_QUICK_ENTRY_CARDS);
        setShortcuts(
          cfg.memberShortcuts?.length ? cfg.memberShortcuts : DEFAULT_MEMBER_SHORTCUTS
        );
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => listVisibleQuickEntryCards(cards), [cards]);

  if (!enabled || visible.length === 0) return null;

  return (
    <section
      className="quick-entry-section w-full bg-[#FFFEFA] px-5 py-8 md:px-8 md:py-10"
      aria-label="功能入口"
    >
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-6 md:grid-cols-4">
        {visible.map((card, index) => {
          const isMember = card.variant === "member" || card.id === "member";
          const isWide = card.variant === "wide" || card.id === "news";

          if (isMember) {
            return (
              <div
                key={card.id}
                className="quick-entry-animate col-span-2 md:col-span-4"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <MemberCenterCard card={card} shortcuts={shortcuts} />
              </div>
            );
          }

          return (
            <div
              key={card.id}
              className={cn(
                isWide ? "col-span-2 md:col-span-1" : "col-span-1",
                "quick-entry-animate"
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <QuickEntryCard card={card} className="h-full" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
