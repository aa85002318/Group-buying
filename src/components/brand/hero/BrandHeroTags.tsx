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
    <div className="mt-5" aria-label="熱門搜尋">
      <p className="mb-3 text-[15px] font-bold text-[#153E73]">熱門搜尋</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              className="inline-flex h-9 flex-none items-center whitespace-nowrap rounded-full border border-[#E9EDF2] bg-white px-3.5 text-[13px] font-medium text-[#153E73] shadow-[0_2px_8px_rgba(21,62,115,0.05)] transition hover:bg-[#FFF5CC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD454]/60"
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
