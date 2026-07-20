"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSUMER_SECONDARY_NAV } from "@/lib/consumer-hub";
import { isMinimalChromePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Desktop secondary hub nav — caramel text, coral active underline */
export function ConsumerHubNav() {
  const pathname = usePathname();
  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav aria-label="服務導覽" className="border-t border-border-soft bg-surface px-4">
      <ul className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto py-1.5 scrollbar-none">
        {CONSUMER_SECONDARY_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isGroup = "accent" in item && item.accent === "groupBuy";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex h-11 min-h-[44px] items-center rounded-xl px-4 text-sm font-medium transition",
                  active
                    ? isGroup
                      ? "bg-groupBuy-soft font-semibold text-groupBuy underline decoration-2 underline-offset-8"
                      : "bg-primary-soft font-semibold text-primary underline decoration-2 underline-offset-8"
                    : "text-caramel hover:bg-peach-soft hover:text-primary"
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
