"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Search, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { APP_ROUTES } from "@/lib/site-links";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import { isMinimalChromePath } from "@/lib/navigation";

function SearchField({ id, className }: { id: string; className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultValue = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const keyword = query.trim();
    if (keyword) {
      router.push(`/products?search=${encodeURIComponent(keyword)}`);
    } else {
      router.push(APP_ROUTES.products);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)} role="search">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜尋商品、品牌或團購名稱"
        className="h-11 w-full rounded-full border border-border bg-brand-blush pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:shadow-brand-ring focus-visible:border-primary"
      />
    </form>
  );
}

function CartButton() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={APP_ROUTES.cart}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-button text-foreground transition hover:bg-brand-blush hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件商品` : ""}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {cartCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
}

function NotifyButton() {
  return (
    <Link
      href="/notifications"
      className="inline-flex h-10 w-10 items-center justify-center rounded-button text-foreground transition hover:bg-brand-blush hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label="通知"
    >
      <Bell className="h-5 w-5" />
    </Link>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href={APP_ROUTES.home} className="inline-flex min-w-0 shrink-0 items-center gap-2 no-underline">
      <Image
        src="/brand/chimeidiy-logo.png"
        alt={BRAND_NAME}
        width={compact ? 36 : 40}
        height={compact ? 36 : 40}
        className={cn("shrink-0 object-contain", compact ? "h-9 w-9" : "h-10 w-10")}
        priority
        unoptimized
      />
      <span className="hidden min-w-0 sm:block">
        <span className="block truncate text-sm font-bold leading-tight text-foreground md:text-base">
          {BRAND_NAME}
        </span>
        <span className="block truncate text-[11px] font-medium text-brand-pink md:text-xs">
          {BRAND_SUBTITLE}
        </span>
      </span>
    </Link>
  );
}

/** Desktop header row: brand + wide search + actions */
export function DesktopHeader({ className }: { className?: string }) {
  return (
    <div className={cn("hidden items-center gap-6 md:flex", className)}>
      <BrandMark />
      <div className="mx-auto w-full max-w-xl flex-1">
        <Suspense fallback={<div className="h-11 rounded-full bg-brand-blush" />}>
          <SearchField id="desktop-header-search" />
        </Suspense>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <NotifyButton />
        <CartButton />
      </div>
    </div>
  );
}

/** Mobile + shared sticky app header */
export function AppHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const syncHeight = () => {
      document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
    };
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [pathname]);

  if (isMinimalChromePath(pathname)) return null;

  return (
    <header
      ref={headerRef}
      className="fixed left-0 right-0 top-0 z-50 border-b border-border/80 bg-background/95 shadow-[0_1px_0_rgba(240,221,221,0.9)] backdrop-blur-md"
    >
      <div className="mx-auto w-full max-w-app page-pad-x">
        <div className="flex flex-col gap-2.5 py-2.5 md:hidden">
          <div className="flex min-h-11 items-center gap-2">
            <BrandMark compact />
            <div className="ml-auto flex items-center gap-0.5">
              <NotifyButton />
              <CartButton />
            </div>
          </div>
          <Suspense fallback={<div className="h-11 rounded-full bg-brand-blush" />}>
            <SearchField id="mobile-header-search" />
          </Suspense>
        </div>

        <div className="hidden py-3 md:block">
          <DesktopHeader />
        </div>
      </div>
    </header>
  );
}
