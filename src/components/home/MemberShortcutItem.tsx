"use client";

import Link from "next/link";
import { useState } from "react";
import type { MemberShortcutItem as MemberShortcutItemType } from "@/types/home-quick-service";
import { cn } from "@/lib/utils";

type MemberShortcutItemProps = {
  item: MemberShortcutItemType;
  className?: string;
};

const PLACEHOLDER = "/images/home/quick-services/shortcut-orders.svg";

export function MemberShortcutItem({ item, className }: MemberShortcutItemProps) {
  const [src, setSrc] = useState(item.imageUrl || PLACEHOLDER);

  return (
    <Link
      href={item.href}
      aria-label={item.title}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD454]/70",
        className
      )}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(21,62,115,0.06)] md:h-14 md:w-14">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.title}
          width={32}
          height={32}
          className="h-6 w-6 object-contain md:h-8 md:w-8"
          onError={() => setSrc(PLACEHOLDER)}
          decoding="async"
        />
      </span>
      <span className="w-full truncate text-[11px] font-semibold leading-tight text-[#153E73] md:text-[13px]">
        {item.title}
      </span>
    </Link>
  );
}
