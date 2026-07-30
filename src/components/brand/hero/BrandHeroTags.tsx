"use client";

import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { SEARCH_SCOPE_PATH, type SearchScope } from "@/components/brand/search/types";
import type { BrandHeroTag } from "./types";

export function BrandHeroTags({
  tags,
  searchScope = "global",
  highlightFirst = true,
}: {
  tags: BrandHeroTag[];
  searchScope?: SearchScope;
  highlightFirst?: boolean;
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
      <div
        className="flex gap-2.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible"
      >
        {active.map((tag, idx) => {
          const isMore = tag.label.replace(/^[^\u4e00-\u9fffA-Za-z0-9]+/, "").trim() === "更多"
            || tag.id === "more"
            || tag.keyword === "__more__";
          const href =
            tag.linkType === "url" && tag.targetUrl
              ? tag.targetUrl
              : isMore
                ? "/products"
                : `${SEARCH_SCOPE_PATH[searchScope] || "/search"}?q=${encodeURIComponent(
                    tag.keyword || tag.label
                  )}`;
          const selected = highlightFirst && idx === 0 && !isMore;

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => router.push(href)}
              className="inline-flex min-h-[44px] flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD454]/60"
              style={
                selected
                  ? {
                      background: "#FFF5CC",
                      border: "1px solid rgba(255, 212, 84, 0.65)",
                      color: "#153E73",
                      boxShadow: "0 2px 8px rgba(21, 62, 115, 0.05)",
                    }
                  : {
                      background: "#FFFFFF",
                      border: "1px solid #E9EDF2",
                      color: "#153E73",
                      boxShadow: "0 2px 8px rgba(21, 62, 115, 0.05)",
                    }
              }
            >
              {isMore ? (
                <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-[#153E73]" aria-hidden />
              ) : null}
              {isMore ? "更多" : tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
