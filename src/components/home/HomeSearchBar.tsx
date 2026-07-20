"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";

type HomeSearchBarProps = {
  placeholder?: string;
  className?: string;
};

export function HomeSearchBar({
  placeholder = "搜尋商品、食譜、品牌或門市位置",
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
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-caramel"
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
        className="h-12 w-full rounded-2xl border border-border bg-surface py-2 pl-10 pr-12 text-sm text-foreground outline-none transition placeholder:text-foreground-secondary focus:border-primary focus:shadow-brand-ring"
      />
      <button
        type="button"
        className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-caramel transition hover:bg-peach-soft hover:text-primary"
        aria-label="掃描條碼（即將推出）"
        disabled
      >
        <ScanLine className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
