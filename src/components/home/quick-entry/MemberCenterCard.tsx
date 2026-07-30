"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MemberShortcut, QuickEntryCardConfig } from "@/types/home-quick-entry";
import { DEFAULT_MEMBER_SHORTCUTS } from "@/types/home-quick-entry";

type MemberCenterCardProps = {
  card: QuickEntryCardConfig;
  shortcuts?: MemberShortcut[];
};

export function MemberCenterCard({
  card,
  shortcuts = DEFAULT_MEMBER_SHORTCUTS,
}: MemberCenterCardProps) {
  return (
    <div
      className="quick-entry-card quick-entry-member group relative overflow-hidden rounded-[28px] border border-[#E9EDF2] p-7 shadow-[0_12px_35px_rgba(21,62,115,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(21,62,115,0.12)]"
      style={{ background: card.background }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <Link
          href={card.href}
          className="flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD454]/60"
        >
          <span
            className="inline-flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[24px] bg-white/80 text-[36px] shadow-[0_8px_20px_rgba(21,62,115,0.08)] backdrop-blur-sm md:h-[72px] md:w-[72px] md:text-[40px]"
            aria-hidden
          >
            {card.emoji}
          </span>
          <div className="min-w-0">
            <h3 className="text-[24px] font-bold text-[#153E73] md:text-[32px]">
              {card.title}
            </h3>
            {card.subtitle ? (
              <p className="mt-1 text-base font-medium text-[#687386] md:text-lg">
                {card.subtitle}
              </p>
            ) : null}
          </div>
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3 sm:justify-start sm:gap-5 md:shrink-0">
          {shortcuts.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex w-[72px] flex-col items-center gap-2 text-center transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD454]/60 sm:w-[80px]"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[24px] shadow-[0_6px_16px_rgba(21,62,115,0.08)]">
                {item.emoji}
              </span>
              <span className="text-[12px] font-semibold leading-tight text-[#153E73] sm:text-[13px]">
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        <Link
          href={card.href}
          aria-label="前往會員中心"
          className="absolute bottom-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#153E73] shadow-[0_6px_16px_rgba(21,62,115,0.1)] transition hover:bg-[#153E73] hover:text-white md:static md:self-end"
        >
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
