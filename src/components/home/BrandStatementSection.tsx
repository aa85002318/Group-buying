"use client";

import Link from "next/link";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { cn } from "@/lib/utils";

export type BrandTag = {
  id: string;
  label: string;
  icon?: string | null;
  href?: string | null;
  sortOrder: number;
  active: boolean;
};

export type BrandStatementConfig = {
  headline?: string;
  tags?: BrandTag[];
};

function parseBrandTags(raw: unknown): BrandTag[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      if (!label) return null;
      return {
        id: String(row.id ?? `tag-${index}`),
        label,
        icon: row.icon ? String(row.icon) : null,
        href: row.href ? String(row.href) : null,
        sortOrder: Number(row.sortOrder ?? row.sort_order ?? index * 10) || index * 10,
        active: row.active !== false,
      };
    })
    .filter(Boolean) as BrandTag[];
}

type BrandStatementSectionProps = {
  config?: BrandStatementConfig | Record<string, unknown> | null;
  className?: string;
};

/** Centered brand headline with horizontally scrollable feature tags. */
export function BrandStatementSection({ config, className }: BrandStatementSectionProps) {
  const cfg = (config ?? {}) as BrandStatementConfig;
  const headline =
    cfg.headline?.trim() || "從靈感到成品，一站完成你的烘焙生活。";
  const tags = parseBrandTags(cfg.tags)
    .filter((t) => t.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!headline && tags.length === 0) return null;

  return (
    <section
      aria-label="品牌定位"
      className={cn("space-y-4 rounded-[20px] px-1 py-2 text-center", className)}
    >
      {headline ? (
        <h2 className="mx-auto max-w-md text-base font-semibold leading-relaxed text-[#6B3F24] sm:text-lg">
          {headline}
        </h2>
      ) : null}
      {tags.length > 0 ? (
        <HorizontalScroller className="justify-center gap-2 md:flex md:flex-wrap md:justify-center md:overflow-visible">
          {tags.map((tag) => {
            const classNames = cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#F2D8BF] bg-[#FFF9EA] px-3.5 py-2 text-xs font-semibold text-[#6B3F24] transition hover:border-[#FF5A5F]/40 hover:text-[#FF5A5F]"
            );
            const content = (
              <>
                {tag.icon ? <span aria-hidden>{tag.icon}</span> : null}
                {tag.label}
              </>
            );
            return tag.href ? (
              <Link key={tag.id} href={tag.href} className={classNames}>
                {content}
              </Link>
            ) : (
              <span key={tag.id} className={classNames}>
                {content}
              </span>
            );
          })}
        </HorizontalScroller>
      ) : null}
    </section>
  );
}
