"use client";

import Link from "next/link";
import { BrandTag } from "@/components/brand/tag/BrandTag";
import { SEARCH_SCOPE_PATH, type SearchScope } from "@/components/brand/search/types";
import type { BrandHeroTag } from "./types";

export function BrandHeroTags({
  tags,
  searchScope = "global",
}: {
  tags: BrandHeroTag[];
  searchScope?: SearchScope;
}) {
  const active = tags
    .filter((t) => t.enabled !== false && t.label.trim())
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (!active.length) return null;

  return (
    <ul className="flex flex-wrap gap-2 px-[var(--page-padding-mobile)] pt-3 md:px-[var(--page-padding-tablet)] lg:px-[var(--page-padding-desktop)]">
      {active.map((tag) => {
        const href =
          tag.linkType === "url" && tag.targetUrl
            ? tag.targetUrl
            : `${SEARCH_SCOPE_PATH[searchScope]}?q=${encodeURIComponent(
                tag.keyword || tag.label
              )}`;
        return (
          <li key={tag.id}>
            <Link href={href} className="brand-focus-ring inline-flex rounded-[var(--radius-pill)]">
              <BrandTag variant="popular">{tag.label}</BrandTag>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
