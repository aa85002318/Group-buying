"use client";

import { useEffect, useState } from "react";
import { BrandCard } from "./BrandCard";
import { BrandButton } from "@/components/brand/button/BrandButton";
import { BrandTag } from "@/components/brand/tag/BrandTag";
import { formatCurrency } from "@/lib/utils";
import type { GroupBuyCardProps } from "./types";

function useCountdown(endAt?: string | null) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!endAt) return;
    const tick = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("已結團");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${h}時 ${m}分 ${s}秒`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endAt]);
  return label;
}

export function GroupBuyCard({
  title,
  href,
  imageUrl,
  price,
  originalPrice,
  endAt,
  progressPercent,
  className,
}: GroupBuyCardProps) {
  const countdown = useCountdown(endAt);
  const progress = Math.max(0, Math.min(100, Number(progressPercent ?? 0)));

  return (
    <BrandCard
      className={className}
      href={href}
      image={imageUrl}
      imageAlt={title}
      title={title}
      badges={<BrandTag variant="limited">團購</BrandTag>}
      footer={
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-baseline gap-2">
            {price != null ? (
              <span className="text-sm font-bold text-[var(--brand-primary)]">
                {formatCurrency(price)}
              </span>
            ) : null}
            {originalPrice != null && price != null && originalPrice > price ? (
              <span className="text-xs text-[var(--brand-text-muted)] line-through">
                {formatCurrency(originalPrice)}
              </span>
            ) : null}
          </div>
          {countdown ? (
            <p className="text-[11px] font-semibold text-[var(--brand-text-secondary)]">
              倒數 {countdown}
            </p>
          ) : null}
          {progressPercent != null ? (
            <div
              className="h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--brand-background-soft)]"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-[var(--radius-pill)] bg-[var(--brand-primary)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          <BrandButton size="sm" fullWidth>
            立即搶購
          </BrandButton>
        </div>
      }
    />
  );
}
