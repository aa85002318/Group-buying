"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickEntryCardConfig } from "@/types/home-quick-entry";

type QuickEntryCardProps = {
  card: QuickEntryCardConfig;
  className?: string;
};

export function QuickEntryCard({ card, className }: QuickEntryCardProps) {
  return (
    <Link
      href={card.href}
      className={cn(
        "quick-entry-card group relative flex min-h-[148px] flex-col overflow-hidden rounded-[28px] border border-[#E9EDF2] p-7 shadow-[0_12px_35px_rgba(21,62,115,0.08)] transition duration-300 md:min-h-[168px]",
        "hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_18px_40px_rgba(21,62,115,0.12)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD454]/60",
        className
      )}
      style={{ background: card.background }}
    >
      {card.badge ? (
        <span className="absolute left-5 top-5 rounded-full bg-[#F16458] px-2.5 py-0.5 text-[10px] font-bold text-white">
          {card.badge}
        </span>
      ) : null}

      <span
        className="quick-entry-icon mb-3 inline-flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-white/70 text-[32px] shadow-[0_8px_20px_rgba(21,62,115,0.08)] backdrop-blur-sm md:mb-4 md:h-[72px] md:w-[72px] md:text-[38px]"
        aria-hidden
      >
        {card.emoji}
      </span>

      <h3 className="text-[22px] font-bold leading-tight text-[#153E73] md:text-[28px] lg:text-[32px]">
        {card.title}
      </h3>
      {card.subtitle ? (
        <p className="mt-1 line-clamp-2 text-base font-medium text-[#687386] md:text-lg">
          {card.subtitle}
        </p>
      ) : null}

      <span className="mt-auto inline-flex h-11 w-11 items-center justify-center self-end rounded-full bg-white text-[#153E73] shadow-[0_6px_16px_rgba(21,62,115,0.1)] transition group-hover:bg-[#153E73] group-hover:text-white">
        <ArrowRight className="h-5 w-5" aria-hidden />
      </span>
    </Link>
  );
}
