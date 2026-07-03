"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart, User } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { useCart } from "@/hooks/useCart";
import { HEADER_CATEGORY_LINKS, isMinimalChromePath } from "@/lib/navigation";
import { APP_ROUTES } from "@/lib/site-links";

const CATEGORY_LINKS = HEADER_CATEGORY_LINKS;

function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold text-tag-text", className)}>chimeidiy 團購</span>
  );
}

function CategoryMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  return (
    <nav
      className={cn(
        "flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-4",
        className
      )}
    >
      {CATEGORY_LINKS.map(({ label, href }) => {
        const [hrefPath, hrefQuery = ""] = href.split("?");
        const isAllProducts = href === "/products";
        const active = isAllProducts
          ? pathname === "/" ||
            (pathname === "/products" && (!currentQuery || currentQuery === ""))
          : hrefPath === pathname &&
            (hrefQuery ? currentQuery === hrefQuery : !currentQuery || currentQuery === "");
        const isPromo = label === "限時優惠";

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex h-11 shrink-0 items-center rounded-full border px-5 text-sm transition-colors md:px-6",
              active
                ? "border-transparent bg-primary text-white"
                : cn(
                    "border-tag-bg bg-white text-coffee hover:border-tag-bg hover:bg-card hover:text-primary",
                    isPromo && "hover:text-promo"
                  )
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SearchBar({
  className,
  defaultValue = "",
  compact = false,
}: {
  className?: string;
  defaultValue?: string;
  compact?: boolean;
}) {
  const router = useRouter();
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
    <form onSubmit={handleSubmit} className={cn("relative shrink-0", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          compact ? "left-3 h-4 w-4" : "left-4 h-4 w-4"
        )}
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={compact ? "搜尋商品…" : "搜尋商品、品牌、團購活動"}
        className={cn(
          "w-full rounded-full border border-tag-bg bg-card text-coffee outline-none transition-colors placeholder:text-muted-foreground focus:border-primary",
          compact
            ? "h-10 pl-9 pr-3 text-sm"
            : "h-12 pl-11 pr-4 text-sm"
        )}
      />
    </form>
  );
}

function CartLink({ className }: { className?: string }) {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      className={cn("relative rounded-full p-2 text-coffee transition-colors hover:text-primary", className)}
      aria-label="購物車"
    >
      <ShoppingCart className="h-5 w-5" />
      {cartCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-promo px-1 text-[10px] font-medium leading-none text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (variant === "auth-login") {
    return (
      <div className={cn("flex shrink-0 items-center gap-2", className)}>
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-coffee hover:text-primary">
          回首頁
        </Link>
        <Link
          href="/auth/register"
          className="rounded-full bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-dark"
        >
          註冊
        </Link>
      </div>
    );
  }

  if (variant === "auth-register") {
    return (
      <div className={cn("flex shrink-0 items-center gap-2", className)}>
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-coffee hover:text-primary">
          回首頁
        </Link>
        <Link
          href="/auth/login"
          className="rounded-full bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-dark"
        >
          登入
        </Link>
      </div>
    );
  }

  const memberHref = isLoggedIn ? APP_ROUTES.profile : APP_ROUTES.login;

  return (
    <div className={cn("flex shrink-0 items-center gap-2 md:gap-4", className)}>
      {isLoggedIn ? (
        <Link
          href={memberHref}
          className="flex items-center gap-1 rounded-full text-sm text-coffee transition-colors hover:text-primary"
          aria-label="會員中心"
        >
          <User className="h-5 w-5 md:hidden" />
          <span className="hidden md:inline">會員中心</span>
        </Link>
      ) : (
        <>
          <Link
            href={APP_ROUTES.login}
            className="rounded-full p-2 text-coffee transition-colors hover:text-primary md:hidden"
            aria-label="登入"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href={APP_ROUTES.login}
            className="hidden rounded-full px-3 py-1.5 text-sm text-coffee hover:text-primary md:inline"
          >
            登入
          </Link>
          <Link
            href={APP_ROUTES.register}
            className="hidden rounded-full bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-dark md:inline"
          >
            註冊
          </Link>
        </>
      )}
      <CartLink />
    </div>
  );
}

function BrandLockup({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center gap-2 md:gap-3", className)}>
      <Logo size="header" />
      <BrandName className="text-base md:text-lg" />
    </Link>
  );
}

function CategoryMenuFallback() {
  return <div className="h-11" />;
}

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight}px`
      );
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
      className="fixed left-0 right-0 top-0 z-50 border-b border-tag-bg bg-white"
    >
      <div className="w-full px-4 md:px-12 lg:px-[72px]">
        <div className="flex flex-col gap-3 py-3 md:gap-0">
          {/* Top row: logo (left) + search & actions (right) */}
          <div className="flex h-12 items-center gap-2 md:h-[72px] md:gap-4">
            <BrandLockup className="min-w-0 shrink-0" />
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3">
              {!isAuthPage && (
                <SearchBar compact className="w-[8.5rem] sm:w-44 md:w-64" />
              )}
              <AuthActions variant={authVariant} />
            </div>
          </div>

          {/* Category chips only — no search below */}
          {!isAuthPage && (
            <div className="pb-1 md:flex md:h-16 md:items-center md:pb-0">
              <Suspense fallback={<CategoryMenuFallback />}>
                <CategoryMenu />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
