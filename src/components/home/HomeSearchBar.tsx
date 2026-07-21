"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";

type HomeSearchBarProps = {
  placeholder?: string;
  className?: string;
};

/** 獨立一列搜尋：高 50–52、圓角 16、右側珊瑚紅按鈕 48–54 */
export function HomeSearchBar({
  placeholder = "搜尋商品、食譜、品牌...",
  className,
}: HomeSearchBarProps) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const keyword = q.trim();
    if (!keyword) {
      router.push(APP_ROUTES.search);
      return;
    }
    router.push(`${APP_ROUTES.search}?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <form onSubmit={submit} role="search" className={cn("w-full", className)}>
      <div className="relative flex h-[52px] items-center rounded-2xl border border-border bg-surface">
        <Search
          className="pointer-events-none absolute left-3.5 h-5 w-5 text-foreground-secondary"
          aria-hidden
        />
        <label htmlFor="app-home-search" className="sr-only">
          搜尋
        </label>
        <input
          id="app-home-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-full w-full rounded-2xl bg-transparent py-2 pl-11 pr-[58px] text-sm text-brand-caramel outline-none placeholder:text-foreground-muted focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
        <button
          type="submit"
          aria-label="搜尋"
          className="absolute right-1.5 top-1/2 flex h-[48px] w-[48px] -translate-y-1/2 items-center justify-center rounded-[14px] bg-brand-primary text-white transition duration-200 hover:bg-primary-hover"
        >
          <Search className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </form>
  );
}
