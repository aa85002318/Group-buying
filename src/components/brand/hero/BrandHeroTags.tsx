"use client";

import { useRouter } from "next/navigation";
import { SEARCH_SCOPE_PATH, type SearchScope } from "@/components/brand/search/types";
import type { BrandHeroTag } from "./types";

export function BrandHeroTags({
  tags,
  searchScope = "global",
}: {
  tags: BrandHeroTag[];
  searchScope?: SearchScope;
}) {
  const router = useRouter();

  const active = tags
    .filter((t) => t.enabled !== false && t.label.trim())
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (!active.length) return null;

  return (
    <div
      className="mt-[10px] flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[374px]:[&>button:nth-child(n+5)]:hidden max-[767px]:gap-[6px] max-[767px]:mt-[7px]"
      aria-label="熱門搜尋"
    >
      {active.map((tag) => {
        const href =
          tag.linkType === "url" && tag.targetUrl
            ? tag.targetUrl
            : `${SEARCH_SCOPE_PATH[searchScope] || "/search"}?q=${encodeURIComponent(
                tag.keyword || tag.label
              )}`;

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => router.push(href)}
            className="inline-flex flex-none items-center whitespace-nowrap rounded-[999px] border border-[#f2e7df] bg-white/[0.94] px-[14px] text-[13px] font-medium text-[#5a4035] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B5B]/50 max-[767px]:h-[27px] max-[767px]:px-[10px] max-[767px]:text-[11px]"
            style={{ height: "32px" }}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
