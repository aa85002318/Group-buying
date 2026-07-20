"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { APP_ROUTES } from "@/lib/site-links";
import { isMinimalChromePath } from "@/lib/navigation";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import { AppHamburgerMenu } from "@/components/layout/AppHamburgerMenu";
import { ConsumerHubNav } from "@/components/consumer/ConsumerHubNav";

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

function MemberButton() {
  return (
    <Link
      href={APP_ROUTES.member}
      className="inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-caramel transition hover:bg-caramel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label="我的會員"
    >
      <User className="h-5 w-5" aria-hidden />
    </Link>
  );
}

function NotifyButton() {
  return (
    <Link
      href={APP_ROUTES.memberNotifications}
      className="relative inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-caramel transition hover:bg-caramel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label="通知中心"
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

function resolveVariant(pathname: string, variant?: AppHeaderVariant): AppHeaderVariant {
  if (variant) return variant;
  return pathname === "/" ? "home" : "standard";
}

/** Consumer Hub / App header — home: Logo left, notify/cart/member right */
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
        "sticky top-0 z-50 w-full shrink-0 border-b border-border-soft bg-surface",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div
        className="mx-auto flex h-14 w-full max-w-[var(--app-max-width)] items-center gap-1 px-4 sm:h-16"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        {resolved === "home" ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-0.5">
              <span className="shrink-0 scale-90 opacity-80">
                <AppHamburgerMenu />
              </span>
              <div className="min-w-0">
                <ChimeidiyLogo variant="header" priority />
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <NotifyButton />
              <CartButton />
              <MemberButton />
            </div>
          </>
        ) : resolved === "search" ? (
          <>
            <BackButton href={backHref} />
            <div className="min-w-0 flex-1 px-2 text-center">
              <h1 className="truncate text-base font-bold text-foreground">{title ?? "搜尋"}</h1>
            </div>
            <div className="flex w-11 shrink-0 justify-end">
              {showCart ? <CartButton /> : <span className="w-11" aria-hidden />}
            </div>
          </>
        ) : (
          <>
            <BackButton href={backHref} />
            <div className="min-w-0 flex-1 px-2 text-center">
              <h1 className="truncate text-base font-bold text-foreground">{title ?? ""}</h1>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-0.5">
              <AppHamburgerMenu />
              {showCart ? <CartButton /> : null}
            </div>
          </>
        )}
      </div>
      <div className="mx-auto hidden w-full max-w-[1280px] md:block">
        <ConsumerHubNav />
      </div>
    </header>
  );
}
