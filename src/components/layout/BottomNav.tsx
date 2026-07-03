"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS, isMinimalChromePath } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();

  if (isMinimalChromePath(pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex w-full min-w-0 items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match ? match(pathname) : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors"
            >
              <Icon className={cn("h-5 w-5 text-nav-icon", active && "text-nav-active")} />
              <span className={cn(active ? "text-nav-active" : "text-nav-inactive")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
