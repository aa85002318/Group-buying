"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Home, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMinimalChromePath } from "@/lib/navigation";
import { CONSUMER_BOTTOM_NAV } from "@/lib/consumer-hub";

const ICONS = {
  "/": Home,
  "/group-buy": Users,
  "/recipes": ChefHat,
  "/member": User,
} as const;

type SideNavItem = (typeof CONSUMER_BOTTOM_NAV)[number];

function SideNavLink({ item, pathname }: { item: SideNavItem; pathname: string }) {
  if ("featured" in item && item.featured) return null;

  const active = item.match(pathname);
  const Icon = ICONS[item.href as keyof typeof ICONS] ?? Home;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className="relative flex w-16 min-w-0 flex-col items-center gap-0.5 py-1 transition duration-200 active:scale-[0.98]"
    >
      <Icon
        className={cn(
          "h-6 w-6 shrink-0 transition duration-200",
          active ? "scale-105 text-brand-primary" : "text-[var(--nav-inactive)]"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "max-w-full truncate text-xs leading-none",
          active ? "font-bold text-brand-primary" : "font-medium text-[var(--nav-inactive)]"
        )}
      >
        {item.label}
      </span>
      {active ? (
        <span
          className="absolute bottom-0 h-1.5 w-1.5 rounded-full bg-brand-primary"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

function FeaturedNavLink({
  item,
  pathname,
}: {
  item: SideNavItem & { featured: true };
  pathname: string;
}) {
  const active = item.match(pathname);

  return (
    <div className="relative flex w-16 flex-col items-center">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        className={cn(
          "absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-angel ring-4 ring-surface transition duration-200 hover:opacity-95 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          active && "ring-primary/25"
        )}
      >
        <Image
          src="/branding/chimeidiy-ip-angel.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          aria-hidden
        />
      </Link>
      <span
        className={cn(
          "mt-8 max-w-full truncate text-xs leading-none",
          active ? "font-bold text-brand-primary" : "font-medium text-[var(--nav-inactive)]"
        )}
      >
        {item.label}
      </span>
    </div>
  );
}

/** 五欄底部導覽 — 中央凸出「烘焙圈」 */
export function MobileBottomNav() {
  const pathname = usePathname();

  if (isMinimalChromePath(pathname)) return null;

  const featuredItem = CONSUMER_BOTTOM_NAV.find(
    (item): item is SideNavItem & { featured: true } =>
      "featured" in item && item.featured === true
  );
  const sideItems = CONSUMER_BOTTOM_NAV.filter((item) => !("featured" in item && item.featured));
  const leftItems = sideItems.slice(0, 2);
  const rightItems = sideItems.slice(2);

  return (
    <nav
      aria-label="主要導覽"
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[var(--app-max-width)] -translate-x-1/2 border-t border-[var(--header-border)] bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="relative mx-auto flex h-[4.25rem] max-w-[var(--app-max-width)] items-end justify-around px-1 pb-1.5">
        {leftItems.map((item) => (
          <SideNavLink key={item.href} item={item} pathname={pathname} />
        ))}
        {featuredItem ? (
          <FeaturedNavLink item={featuredItem} pathname={pathname} />
        ) : null}
        {rightItems.map((item) => (
          <SideNavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
