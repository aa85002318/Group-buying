"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  Package,
  Search,
  ShoppingCart,
  User,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { useCart } from "@/hooks/useCart";
import {
  HEADER_CATEGORY_LINKS,
  isMinimalChromePath,
} from "@/lib/navigation";
import { APP_ROUTES } from "@/lib/site-links";
import {
  DEFAULT_HEADER_PROMO_ITEMS,
  type HeaderPromoItem,
} from "@/lib/site-header";

type HeaderChip = {
  href: string;
  label: string;
  badge?: "hot" | "live";
  iconEmoji?: string | null;
  icon?: LucideIcon;
};

function BrandLockup({ className }: { className?: string }) {
  return (
    <Logo
      href="/"
      size="header"
      withText
      markOnly
      priority
      className={cn("max-w-full", className)}
      title="CHIMEIDIY 團購"
      subtitle="棋美點心屋"
    />
  );
}

function CategoryMenu({ className, links }: { className?: string; links: HeaderChip[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  const isActive = (href: string) => {
    if (href.startsWith("http://") || href.startsWith("https://")) return false;

    const baseHref = href.split("?")[0];

    if (baseHref === "/products") {
      const params = new URLSearchParams(href.split("?")[1] ?? "");
      const expectedCategory = params.get("category");
      const pathnameParams = searchParams.toString();
      const current = new URLSearchParams(pathnameParams);
      const currentCategory = current.get("category");
      const currentSearch = current.get("search");

      if (expectedCategory) {
        return pathname === "/products" && currentCategory === expectedCategory && !currentSearch;
      }

      // "全部商品" => no category & no search
      return pathname === "/products" && !currentCategory && !currentSearch;
    }

    if (baseHref === "/") return pathname === "/";
    if (pathname === baseHref) return true;
    return pathname.startsWith(`${baseHref}/`);
  };

  return (
    <div className={cn("relative w-fit max-w-full", className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="header-category-menu"
        aria-label={isOpen ? "收合商品導覽" : "展開商品導覽"}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-line bg-white text-brand-red shadow-sm transition hover:border-brand-red/30 hover:bg-brand-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {isOpen && (
        <nav
          id="header-category-menu"
          aria-label="商品分類"
          className="absolute left-0 top-full z-50 mt-2 max-h-[min(60vh,28rem)] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-brand-line bg-white p-2 shadow-xl"
        >
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {links.map(({ label, href, icon: Icon, badge, iconEmoji }) => {
          const active = isActive(href);
          const classNameValue = cn(
            "inline-flex h-10 min-w-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30",
            active
              ? "bg-brand-gradient text-white shadow-brand"
              : "bg-transparent text-brand-ink hover:bg-brand-blush hover:text-brand-red"
          );
          const content = (
            <>
              {iconEmoji ? (
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center text-sm",
                    active ? "text-white" : "text-brand-orange"
                  )}
                  aria-hidden
                >
                  {iconEmoji}
                </span>
              ) : Icon ? (
                <Icon
                  className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-brand-orange")}
                  aria-hidden
                />
              ) : null}
              <span>{label}</span>
              {badge === "hot" && !active && (
                <span className="text-[10px] font-bold text-brand-orange" aria-hidden>
                  HOT
                </span>
              )}
              {badge === "live" && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    active ? "bg-white/20 text-white" : "bg-brand-red text-white"
                  )}
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                  LIVE
                </span>
              )}
            </>
          );

          const isExternal = href.startsWith("http://") || href.startsWith("https://");
          if (isExternal) {
            return (
              <a
                key={`${label}-${href}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={classNameValue}
                onClick={() => setIsOpen(false)}
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={`${label}-${href}`}
              href={href}
              className={classNameValue}
              onClick={() => setIsOpen(false)}
            >
              {content}
            </Link>
          );
        })}
          </div>
        </nav>
      )}
    </div>
  );
}

function SearchBar({
  className,
  id = "header-search",
}: {
  className?: string;
  id?: string;
}) {
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
      router.push("/products");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)} role="search">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-red"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜尋商品、品牌或團購活動"
        className="h-10 w-full rounded-full border-[1.5px] border-[#F2B4AE] bg-brand-warm pl-11 pr-12 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-red focus:shadow-brand-ring focus-visible:border-brand-red focus-visible:shadow-brand-ring"
      />
      <button
        type="submit"
        className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand-gradient text-white shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40"
        aria-label="搜尋"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

function CartLink({ showLabel = false }: { showLabel?: boolean }) {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      className="relative inline-flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-brand-ink transition hover:bg-brand-blush hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 md:flex-row md:gap-1.5 md:px-2.5"
      aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件商品` : ""}`}
    >
      <span className="relative">
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold leading-none text-white">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </span>
      {showLabel && <span className="hidden text-xs font-medium md:inline md:text-sm">購物車</span>}
    </Link>
  );
}

function IconAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof User;
}) {
  return (
    <Link
      href={href}
      className="inline-flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-brand-ink transition hover:bg-brand-blush hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 md:flex-row md:gap-1.5 md:px-2.5"
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden text-xs font-medium md:inline md:text-sm">{label}</span>
    </Link>
  );
}

function AuthActions({
  variant,
  className,
}: {
  variant: "default" | "auth-login" | "auth-register";
  className?: string;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoggedIn(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (variant === "auth-login") {
    return (
      <div className={cn("flex shrink-0 items-center gap-2", className)}>
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-brand-ink hover:text-brand-red">
          回首頁
        </Link>
        <Link
          href="/auth/register"
          className="rounded-full bg-brand-gradient px-3 py-1.5 text-sm text-white shadow-sm"
        >
          註冊
        </Link>
      </div>
    );
  }

  if (variant === "auth-register") {
    return (
      <div className={cn("flex shrink-0 items-center gap-2", className)}>
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-brand-ink hover:text-brand-red">
          回首頁
        </Link>
        <Link
          href="/auth/login"
          className="rounded-full bg-brand-gradient px-3 py-1.5 text-sm text-white shadow-sm"
        >
          登入
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center gap-0.5 md:gap-1", className)}>
      {isLoggedIn ? (
        <>
          <IconAction href={APP_ROUTES.orders} label="我的團購" icon={Package} />
          <IconAction href={APP_ROUTES.profile} label="會員中心" icon={User} />
        </>
      ) : (
        <>
          <IconAction href={APP_ROUTES.login} label="我的團購" icon={Package} />
          <IconAction href={APP_ROUTES.login} label="會員中心" icon={User} />
          <Link
            href={APP_ROUTES.register}
            className="ml-1 hidden rounded-full bg-brand-gradient px-3 py-1.5 text-sm font-medium text-white shadow-sm md:inline"
          >
            註冊
          </Link>
        </>
      )}
      <CartLink showLabel />
    </div>
  );
}

function QuickPromoStrip({ items }: { items: HeaderPromoItem[] }) {
  if (items.length === 0) return null;

  return (
    <div
      aria-label="團購快捷資訊"
      className="overflow-hidden rounded-xl bg-promo-strip px-3 py-2 md:px-4"
    >
      <ul className="flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-none md:justify-center md:gap-6">
        {items.map(({ id, label, value, suffix, icon_emoji, href }) => {
          const content = (
            <>
              {icon_emoji ? <span aria-hidden>{icon_emoji}</span> : null}
              <span>{label}</span>
              {value ? (
                <span className="font-bold text-brand-orange">
                  {value}
                  {suffix}
                </span>
              ) : null}
            </>
          );
          const className =
            "inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#9F1D1D] md:text-sm";

          return (
            <li key={id}>
              {href ? (
                href.startsWith("http") ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                    {content}
                  </a>
                ) : (
                  <Link href={href} className={className}>
                    {content}
                  </Link>
                )
              ) : (
                <span className={className}>{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CategoryMenuFallback() {
  return <div className="h-10 w-10 rounded-xl border border-brand-line bg-white" />;
}

function SearchFallback({ className }: { className?: string }) {
  return <div className={cn("h-10 rounded-full bg-brand-warm", className)} />;
}

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [siteHeaderConfig, setSiteHeaderConfig] = useState<{
    links: Array<{ href: string; label: string; badge?: "hot" | "live"; icon_emoji?: string }>;
    promoItems?: HeaderPromoItem[];
  } | null>(null);

  useEffect(() => {
    // load from DB so header content can be managed in back-office
    fetch("/api/site-header")
      .then((r) => r.json())
      .then((d) => setSiteHeaderConfig(d ?? null))
      .catch(() => {});
  }, []);

  const links: HeaderChip[] = useMemo(() => {
    if (siteHeaderConfig?.links?.length) {
      return siteHeaderConfig.links.map((l) => ({
        href: l.href,
        label: l.label,
        badge: l.badge,
        iconEmoji: l.icon_emoji ?? null,
      }));
    }

    return HEADER_CATEGORY_LINKS.map(({ label, href, icon, badge }) => ({
      href,
      label,
      badge,
      icon,
    }));
  }, [siteHeaderConfig]);

  const promoItems = Array.isArray(siteHeaderConfig?.promoItems)
    ? siteHeaderConfig.promoItems
    : DEFAULT_HEADER_PROMO_ITEMS;

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

  const authVariant =
    pathname === "/auth/login"
      ? "auth-login"
      : pathname === "/auth/register"
        ? "auth-register"
        : "default";

  const isAuthPage = authVariant !== "default";

  return (
    <header
      ref={headerRef}
      className="fixed left-0 right-0 top-0 z-50 border-b border-brand-line/80 bg-white/95 shadow-[0_1px_0_rgba(242,222,220,0.9)] backdrop-blur-sm"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="flex flex-col gap-2 py-2.5 md:py-3">
          {/* Layer 1: menu + centered brand + actions */}
          <div className="grid min-h-[48px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center md:min-h-[56px]">
            <div className="flex min-w-0 justify-start">
              {!isAuthPage && (
                <Suspense fallback={<CategoryMenuFallback />}>
                  <CategoryMenu links={links} />
                </Suspense>
              )}
            </div>

            <BrandLockup className="max-w-[150px] justify-self-center sm:max-w-none" />

            <div className="flex min-w-0 justify-end">
              <AuthActions variant={authVariant} />
            </div>
          </div>

          {/* Full-width search */}
          {!isAuthPage && (
            <div className="mx-auto w-full max-w-2xl">
              <Suspense fallback={<SearchFallback />}>
                <SearchBar id="header-search" />
              </Suspense>
            </div>
          )}

          {/* Promo strip */}
          {!isAuthPage && <QuickPromoStrip items={promoItems} />}
        </div>
      </div>
    </header>
  );
}
