"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Search, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { APP_ROUTES } from "@/lib/site-links";
import { isMinimalChromePath } from "@/lib/navigation";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";

export type AppHeaderVariant = "home" | "standard" | "detail" | "search";

export type AppHeaderProps = {
  variant?: AppHeaderVariant;
  title?: string;
  showCart?: boolean;
  backHref?: string;
  className?: string;
};

function CartButton() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={APP_ROUTES.cart}
      className="relative inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-caramel transition hover:bg-caramel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件商品` : ""}`}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
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
      href={APP_ROUTES.memberNotifications}
      className="inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-caramel transition hover:bg-caramel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label="通知"
    >
      <Bell className="h-5 w-5" aria-hidden />
    </Link>
  );
}

function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
      className="inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-caramel transition hover:bg-caramel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label="返回"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
    </button>
  );
}

function SearchButton() {
  return (
    <Link
      href={APP_ROUTES.search}
      className="inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-caramel transition hover:bg-caramel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label="搜尋"
    >
      <Search className="h-5 w-5" aria-hidden />
    </Link>
  );
}

function resolveVariant(pathname: string, variant?: AppHeaderVariant): AppHeaderVariant {
  if (variant) return variant;
  return pathname === "/" ? "home" : "standard";
}

/** Mobile-first App header — home / standard / detail / search */
export function AppHeader({
  variant,
  title,
  showCart = true,
  backHref,
  className,
}: AppHeaderProps) {
  const pathname = usePathname();
  const resolved = resolveVariant(pathname, variant);

  if (isMinimalChromePath(pathname)) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-surface",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-[60px] w-full max-w-[960px] items-center gap-2 px-4">
        {resolved === "home" ? (
          <>
            <div className="flex w-[92px] shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center justify-center">
              <ChimeidiyLogo variant="header" priority />
            </div>
            <div className="flex w-[92px] shrink-0 items-center justify-end gap-0.5">
              <NotifyButton />
              <CartButton />
            </div>
          </>
        ) : resolved === "search" ? (
          <>
            <BackButton href={backHref} />
            <div className="min-w-0 flex-1 text-center">
              <h1 className="truncate text-base font-bold text-foreground">
                {title ?? "搜尋"}
              </h1>
            </div>
            <div className="flex w-11 shrink-0 justify-end">
              {showCart ? <CartButton /> : <span className="w-11" aria-hidden />}
            </div>
          </>
        ) : (
          <>
            <BackButton href={backHref} />
            <div className="min-w-0 flex-1 text-center">
              <h1 className="truncate text-base font-bold text-foreground">
                {title ?? ""}
              </h1>
            </div>
            <div className="flex w-11 shrink-0 items-center justify-end gap-0.5">
              {resolved === "detail" && !showCart ? (
                <SearchButton />
              ) : showCart ? (
                <CartButton />
              ) : (
                <span className="w-11" aria-hidden />
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
