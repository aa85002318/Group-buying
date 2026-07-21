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
    <form
      onSubmit={submit}
      role="search"
      className={cn("relative w-full", className)}
    >
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-secondary"
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
        className={cn(
          "h-[52px] w-full rounded-[18px] border border-border bg-surface py-2 pl-11 pr-14 text-sm text-brand-caramel outline-none transition duration-200",
          "placeholder:text-foreground-muted",
          "focus:border-brand-primary focus:shadow-[0_0_0_3px_var(--focus-ring)]",
          "sm:pr-[5.5rem]"
        )}
      />
      <button
        type="submit"
        aria-label="搜尋"
        className={cn(
          "absolute right-1.5 top-1/2 inline-flex h-10 min-h-[40px] -translate-y-1/2 items-center justify-center gap-1.5 rounded-[14px] bg-brand-primary px-3 text-sm font-bold text-white transition duration-200",
          "hover:bg-primary-hover active:bg-primary-active"
        )}
      >
        <Search className="h-4 w-4 sm:hidden" aria-hidden />
        <span className="hidden sm:inline">搜尋</span>
      </button>
    </form>
  );
}
