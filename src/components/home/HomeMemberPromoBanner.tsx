"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type HomeMemberPromoBannerProps = {
  enabled?: boolean;
  imageUrl?: string | null;
  href?: string;
  alt?: string;
  className?: string;
};

/**
 * 5:2 wide promo banner under the homepage member-center card.
 */
export function HomeMemberPromoBanner({
  enabled = true,
  imageUrl,
  href = "/shop",
  alt = "活動 Banner",
  className,
}: HomeMemberPromoBannerProps) {
  const [broken, setBroken] = useState(false);
  const hasImage = Boolean(imageUrl?.trim()) && !broken;

  if (!enabled) return null;

  const inner = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[18px] border border-[#E9EDF2] bg-[linear-gradient(135deg,#FFF7CC_0%,#EEF8FC_100%)] shadow-[0_8px_22px_rgba(21,62,115,0.06)]",
        "aspect-[5/2]",
        className
      )}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
          <p className="text-base font-bold text-[#153E73] md:text-xl">{alt}</p>
          <p className="text-xs text-[#687386] md:text-sm">建議尺寸 1500×600（5:2）</p>
        </div>
      )}
    </div>
  );

  if (!href?.trim()) return inner;

  return (
    <Link
      href={href}
      className="mt-4 block transition hover:opacity-95 md:mt-5"
      aria-label={alt}
    >
      {inner}
    </Link>
  );
}
