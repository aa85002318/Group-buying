"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  resolveQuickMenuIcon,
  type HomeQuickMenuItem,
} from "@/lib/home/quick-menu";

type QuickMenuItemProps = {
  item: HomeQuickMenuItem;
  className?: string;
};

export function QuickMenuItem({ item, className }: QuickMenuItemProps) {
  const Icon = resolveQuickMenuIcon(item);
  const alt = item.alt_text || item.title;
  const isExternal = item.link_target === "_blank";

  return (
    <Link
      href={item.link_url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={item.title}
      className={cn(
        "quick-menu-item group flex shrink-0 flex-col items-center justify-center",
        "w-[88px] min-w-[88px] max-w-[130px] px-2 py-3",
        "min-[375px]:w-[96px] min-[375px]:min-w-[96px]",
        "sm:w-[110px] sm:min-w-[110px] sm:px-2.5 sm:py-[18px]",
        "snap-start bg-transparent text-center no-underline",
        "outline-none transition duration-180",
        "focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
    >
      <span className="mx-auto mb-2.5 flex h-[52px] w-[52px] items-center justify-center sm:h-[58px] sm:w-[58px]">
        {item.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.icon_url}
            alt={alt}
            className="h-[46px] w-[46px] object-contain transition duration-180 group-hover:scale-105 sm:h-[52px] sm:w-[52px]"
          />
        ) : (
          <Icon
            className="h-8 w-8 text-brand-caramel transition duration-180 group-hover:scale-105 group-hover:text-brand-primary sm:h-9 sm:w-9"
            aria-hidden
          />
        )}
      </span>
      <span className="line-clamp-2 text-[13px] font-semibold leading-[1.35] text-brand-caramel transition-colors group-hover:text-brand-primary sm:text-sm">
        {item.title}
      </span>
    </Link>
  );
}
