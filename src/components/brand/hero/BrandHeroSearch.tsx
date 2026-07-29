"use client";

import { BrandSearch } from "@/components/brand/search/BrandSearch";
import type { SearchScope } from "@/components/brand/search/types";

export function BrandHeroSearch({
  placeholder,
  scope = "global",
}: {
  placeholder?: string | null;
  scope?: SearchScope;
}) {
  return (
    <BrandSearch
      floating
      scope={scope}
      placeholder={placeholder || "搜尋商品、食譜、課程…"}
      className="mx-[var(--page-padding-mobile)] md:mx-[var(--page-padding-tablet)] lg:mx-[var(--page-padding-desktop)]"
    />
  );
}
