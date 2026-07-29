"use client";

import Link from "next/link";
import { BrandIcon } from "@/components/brand/icon/BrandIcon";
import type { BrandIconKey } from "@/components/brand/icon/icon-map";
import type { BrandNavItem } from "./types";
import { cn } from "@/lib/utils";

export function BrandHeader({
  items,
  className,
}: {
  items: BrandNavItem[];
  className?: string;
}) {
  const list = items
    .filter((i) => i.enabled !== false && i.desktopVisible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <nav
      className={cn(
        "hidden items-center gap-4 md:flex",
        className
      )}
      style={{ minHeight: "var(--header-height-desktop)" }}
      aria-label="主選單"
    >
      {list.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="brand-focus-ring text-sm font-semibold text-[var(--brand-text-primary)] hover:text-[var(--brand-primary)]"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function BrandBottomNavigation({
  items,
  activeHref,
  className,
}: {
  items: BrandNavItem[];
  activeHref?: string;
  className?: string;
}) {
  const list = items
    .filter((i) => i.enabled !== false && i.mobileVisible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 5);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--brand-border)] bg-[var(--brand-surface)] pb-[env(safe-area-inset-bottom)] md:hidden",
        className
      )}
      aria-label="底部導覽"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {list.map((item) => {
          const active = activeHref === item.href || activeHref?.startsWith(`${item.href}/`);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "brand-focus-ring flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-bold",
                  active
                    ? "text-[var(--brand-primary)]"
                    : "text-[var(--brand-text-muted)]"
                )}
              >
                <BrandIcon
                  name={(item.iconKey as BrandIconKey) || "home"}
                  size={22}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BrandDrawer({
  items,
  open,
  onClose,
}: {
  items: BrandNavItem[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const list = items
    .filter((i) => i.enabled !== false && i.mobileVisible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-label="選單">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="關閉選單"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-[min(100%,320px)] flex-col bg-[var(--brand-surface)] shadow-[var(--shadow-md)]">
        <div className="flex items-center justify-between border-b border-[var(--brand-border)] px-4 py-3">
          <p className="font-bold text-[var(--brand-text-primary)]">選單</p>
          <button
            type="button"
            className="brand-focus-ring rounded-[var(--radius-sm)] p-2"
            onClick={onClose}
            aria-label="關閉"
          >
            <BrandIcon name="close" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {list.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className="brand-focus-ring flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-semibold text-[var(--brand-text-primary)] hover:bg-[var(--brand-background-soft)]"
                onClick={onClose}
              >
                <BrandIcon name={(item.iconKey as BrandIconKey) || "help"} />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function BrandBreadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="麵包屑" className="text-sm text-[var(--brand-text-secondary)]">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <a href={item.href} className="brand-focus-ring hover:text-[var(--brand-primary)]">
                {item.label}
              </a>
            ) : (
              <span className="font-semibold text-[var(--brand-text-primary)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
