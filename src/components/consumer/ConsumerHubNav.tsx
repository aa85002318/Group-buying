"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSUMER_SECONDARY_NAV } from "@/lib/consumer-hub";
import { isMinimalChromePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Desktop secondary hub nav — sticky under header */
export function ConsumerHubNav() {
  const pathname = usePathname();
  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav
      aria-label="服務導覽"
      className="sticky top-[var(--header-height)] z-30 -mx-4 mb-4 hidden border-b border-border bg-surface/95 px-4 backdrop-blur md:mx-0 md:block md:rounded-2xl md:border md:px-2"
    >
      <ul className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
        {CONSUMER_SECONDARY_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isGroup = "accent" in item && item.accent === "groupBuy";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition",
                  active
                    ? isGroup
                      ? "bg-groupBuy text-white"
                      : "bg-primary text-white"
                    : "text-foreground-secondary hover:bg-surface-soft hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
