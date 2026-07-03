"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "price_asc" | "price_desc";

export function ProductSortBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSort = (searchParams.get("sort") as SortOption) || "newest";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">排序</span>
      {(
        [
          { value: "newest", label: "最新" },
          { value: "price_asc", label: "價格低→高" },
          { value: "price_desc", label: "價格高→低" },
        ] as const
      ).map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => updateParams({ sort: value === "newest" ? null : value })}
          className={cn(
            "rounded-lg px-2 py-1 text-xs transition-colors",
            activeSort === value
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:text-coffee"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
