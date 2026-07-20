"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeSearchBar({
  className,
  placeholder = "搜尋商品、食譜、團購、門市位置…",
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const keyword = q.trim();
    router.push(keyword ? `/search?q=${encodeURIComponent(keyword)}` : "/search");
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn("relative w-full", className)}
      aria-label="全站搜尋"
    >
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
        aria-hidden
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-12 min-h-touch w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-foreground-secondary focus:border-primary focus:shadow-brand-ring"
        aria-label={placeholder}
      />
    </form>
  );
}
