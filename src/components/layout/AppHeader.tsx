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
import { BakingCatalogSideMenu } from "@/components/baking/BakingCatalogSideMenu";
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
      className="relative inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-[var(--header-icon)] transition duration-200 hover:bg-[var(--yellow-soft)] hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件商品` : ""}`}
    >
      <ShoppingCart className="h-6 w-6" aria-hidden />
      {cartCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold leading-none text-white">
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
      className="inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-[var(--header-icon)] transition duration-200 hover:bg-[var(--yellow-soft)] hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label="我的會員"
    >
      <User className="h-6 w-6" aria-hidden />
    </Link>
  );
}

function NotifyButton() {
  return (
    <Link
      href={APP_ROUTES.memberNotifications}
      className="relative inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-[var(--header-icon)] transition duration-200 hover:bg-[var(--yellow-soft)] hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      aria-label="通知中心"
    >
      <Bell className="h-6 w-6" aria-hidden />
    </Link>
  );
}

function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
      className="inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-[var(--header-icon)] transition duration-200 hover:bg-[var(--yellow-soft)] hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
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

function isBakingMaterialsPath(pathname: string): boolean {
  return pathname === "/baking-materials" || pathname.startsWith("/baking-materials/");
}

/** Sticky white header 64px — Logo left, notify / cart / member right (no full-bleed red) */
export function AppHeader({
  variant,
  title,
  showCart = true,
  backHref,
  className,
}: AppHeaderProps) {
  const pathname = usePathname();
  const resolved = resolveVariant(pathname, variant);
  const bakingMaterials = isBakingMaterialsPath(pathname);
  const headerTitle = bakingMaterials
    ? title ?? "烘焙材料"
    : title ?? "";

  if (isMinimalChromePath(pathname)) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full shrink-0 border-b bg-surface",
        "border-[var(--header-border)]",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-16 w-full max-w-[var(--app-max-width)] items-center gap-1 px-4"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        {resolved === "home" ? (
          <>
            <div className="min-w-0 flex-1">
              <ChimeidiyLogo variant="header" priority />
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
              <h1 className="truncate text-base font-bold text-brand-caramel">
                {title ?? "搜尋"}
              </h1>
            </div>
            <div className="flex w-11 shrink-0 justify-end">
              {showCart ? <CartButton /> : <span className="w-11" aria-hidden />}
            </div>
          </>
        ) : (
          <>
            <BackButton href={backHref ?? (bakingMaterials ? "/" : undefined)} />
            <div className="min-w-0 flex-1 px-2 text-center">
              <h1 className="truncate text-base font-bold text-brand-caramel">{headerTitle}</h1>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-0.5">
              {bakingMaterials ? <BakingCatalogSideMenu /> : <AppHamburgerMenu />}
              {showCart ? <CartButton /> : null}
            </div>
          </>
        )}
      </div>
      {/* 首頁與烘焙材料頁不顯示桌機第二層選單 */}
      {resolved !== "home" && !bakingMaterials ? (
        <div className="mx-auto hidden w-full max-w-[1280px] md:block">
          <ConsumerHubNav />
        </div>
      ) : null}
    </header>
  );
}
