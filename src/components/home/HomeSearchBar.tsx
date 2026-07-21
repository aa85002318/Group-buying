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

/** Standalone search row under the sticky header. */
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
      <div className="relative flex h-[50px] items-center rounded-[16px] border border-border bg-surface md:h-[52px]">
        <Search
          className="pointer-events-none absolute left-3.5 h-4.5 w-4.5 text-foreground-secondary md:h-5 md:w-5"
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
          className="h-full w-full rounded-[16px] bg-transparent py-2 pl-11 pr-[62px] text-sm text-brand-caramel outline-none placeholder:text-foreground-muted focus:border-brand-primary focus:shadow-[0_0_0_3px_var(--focus-ring)] md:pr-[5.5rem]"
        />
        <button
          type="submit"
          aria-label="搜尋"
          className="absolute right-1.5 top-1/2 flex h-10 w-12 -translate-y-1/2 items-center justify-center rounded-[12px] bg-brand-primary text-white transition duration-200 hover:bg-primary-hover min-[375px]:w-[52px] md:h-10 md:w-auto md:min-w-[72px] md:px-3"
        >
          <Search className="h-5 w-5" aria-hidden />
          <span className="hidden md:inline md:text-sm md:font-bold">搜尋</span>
        </button>
      </div>
    </form>
  );
}
