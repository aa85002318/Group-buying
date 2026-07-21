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
    <form onSubmit={submit} role="search" className={cn("relative w-full", className)}>
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
        className="h-12 w-full rounded-2xl border border-border bg-surface py-2 pl-11 pr-[5.5rem] text-sm text-brand-caramel outline-none transition placeholder:text-foreground-muted focus:border-brand-primary focus:shadow-brand-ring md:h-[52px]"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center rounded-xl bg-brand-primary px-3.5 text-sm font-bold text-white transition duration-200 hover:bg-primary-hover active:scale-[0.98]"
      >
        搜尋
      </button>
    </form>
  );
}
