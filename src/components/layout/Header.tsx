"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CakeSlice,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  CookingPot,
  CupSoda,
  FileText,
  Flame,
  Leaf,
  Menu,
  Package,
  PackagePlus,
  PlayCircle,
  Radio,
  Search,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  Sparkles,
  SprayCan,
  Star,
  User,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { useCart } from "@/hooks/useCart";
import { isMinimalChromePath } from "@/lib/navigation";
import { APP_ROUTES } from "@/lib/site-links";
import {
  DEFAULT_HEADER_PROMO_ITEMS,
  DEFAULT_SIDE_MENU_SECTIONS,
  type HeaderPromoItem,
  type SideMenuColorKey,
  type SideMenuIconKey,
  type SideMenuSection,
} from "@/lib/site-header";
import type { ProductCategory } from "@/lib/types/database";

function BrandLockup({ className }: { className?: string }) {
  return (
    <Logo
      href="/"
      size="header"
      markOnly
      priority
      className={cn("max-w-full", className)}
      title="CHIMEIDIY 團購"
    />
  );
}

const FALLBACK_MENU_CATEGORIES = [
  "烘焙食品",
  "生鮮食材",
  "冷凍食品",
  "零食飲料",
  "居家清潔",
  "廚房用品",
  "季節限定",
] as const;

const CATEGORY_VISUALS: Array<{ icon: LucideIcon; background: string; foreground: string }> = [
  { icon: CakeSlice, background: "bg-groupBuy-soft", foreground: "text-groupBuy" },
  { icon: Leaf, background: "bg-success-soft", foreground: "text-success" },
  { icon: Snowflake, background: "bg-info-soft", foreground: "text-info" },
  { icon: CupSoda, background: "bg-primary-soft", foreground: "text-primary" },
  { icon: SprayCan, background: "bg-info-soft", foreground: "text-info" },
  { icon: CookingPot, background: "bg-warning-soft", foreground: "text-foreground" },
  { icon: CalendarDays, background: "bg-primary-soft", foreground: "text-primary" },
];

const SIDE_MENU_ICONS: Record<SideMenuIconKey, LucideIcon> = {
  flame: Flame,
  package: PackagePlus,
  clock: Clock3,
  star: Star,
  "shopping-bag": ShoppingBag,
  radio: Radio,
  play: PlayCircle,
  video: Video,
  article: FileText,
  sparkles: Sparkles,
};

const SIDE_MENU_COLORS: Record<
  SideMenuColorKey,
  { background: string; foreground: string }
> = {
  berry: { background: "bg-primary-soft", foreground: "text-primary" },
  coral: { background: "bg-error-soft", foreground: "text-error" },
  orange: { background: "bg-groupBuy-soft", foreground: "text-groupBuy" },
  yellow: { background: "bg-warning-soft", foreground: "text-foreground" },
  purple: { background: "bg-info-soft", foreground: "text-info" },
  blue: { background: "bg-info-soft", foreground: "text-info" },
  green: { background: "bg-success-soft", foreground: "text-success" },
  teal: { background: "bg-success-soft", foreground: "text-success" },
  pink: { background: "bg-primary-soft", foreground: "text-primary" },
};

type SideMenuItemProps = {
  href: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
  onNavigate: () => void;
};

function SideMenuItem({
  href,
  title,
  description,
  icon: Icon,
  iconBackground,
  iconColor,
  onNavigate,
}: SideMenuItemProps) {
  const className =
    "group flex h-14 w-full items-center gap-3 px-5 text-left transition-all duration-200 ease-in-out hover:translate-x-1.5 hover:bg-surface-soft active:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40";
  const content = (
    <>
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          iconBackground
        )}
      >
        <Icon className={cn("h-[26px] w-[26px]", iconColor)} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-foreground">{title}</span>
        {description && (
          <span className="block truncate text-[11px] font-medium text-foreground-secondary">
            {description}
          </span>
        )}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-foreground-secondary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </>
  );

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

function MenuSectionTitle({
  title,
  icon: Icon,
  iconColor,
}: {
  title: string;
  icon: LucideIcon;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-2 px-5 pb-2 pt-4">
      <Icon className={cn("h-5 w-5", iconColor)} aria-hidden />
      <h2 className="text-sm font-black tracking-wide text-foreground">{title}</h2>
    </div>
  );
}

function CategoryMenu({
  className,
  categories,
  sections,
}: {
  className?: string;
  categories: ProductCategory[];
  sections: SideMenuSection[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);
  const displayedSections = sections.length > 0 ? sections : DEFAULT_SIDE_MENU_SECTIONS;
  const displayedCategories =
    categories.length > 0
      ? categories.map((category) => ({
          id: category.id,
          name: category.name,
          href: `/products?category=${category.id}`,
        }))
      : FALLBACK_MENU_CATEGORIES.map((name, index) => ({
          id: `fallback-${index}`,
          name,
          href: "/categories",
        }));

  return (
    <div className={cn("w-fit max-w-full", className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="header-category-menu"
        aria-label={isOpen ? "收合商品導覽" : "展開商品導覽"}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-line bg-surface text-brand-red shadow-sm transition hover:border-brand-red/30 hover:bg-brand-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--text-primary)]/35 backdrop-blur-[2px]"
            onClick={closeMenu}
            aria-label="關閉選單"
          />
          <aside
            id="header-category-menu"
            aria-label="主要購物選單"
            className="absolute bottom-3 left-3 top-3 flex flex-col overflow-hidden rounded-[24px] bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            style={{ width: "min(360px, calc(100vw - 24px))" }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <div>
                <p className="text-base font-black text-foreground">CHIMEIDIY 購物選單</p>
                <p className="text-[11px] font-medium text-foreground-secondary">快速找到今天最值得買的商品</p>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-full bg-surface-soft text-primary transition-colors duration-200 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="關閉選單"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5">
              {displayedSections.map((section, sectionIndex) => {
                const SectionIcon = SIDE_MENU_ICONS[section.icon];
                const sectionColor = SIDE_MENU_COLORS[section.color];
                const trigger = section.items[0];

                return (
                  <div key={section.id}>
                    {sectionIndex > 0 && (
                      <div className="mx-5 my-3 border-t border-border" />
                    )}
                    <MenuSectionTitle
                      title={section.title}
                      icon={SectionIcon}
                      iconColor={sectionColor.foreground}
                    />

                    {section.kind === "categories" && trigger ? (
                      <>
                        <button
                type="button"
                aria-expanded={categoriesOpen}
                aria-controls="side-menu-categories"
                onClick={() => setCategoriesOpen((open) => !open)}
                className="group flex h-14 w-full items-center gap-3 px-5 text-left transition-all duration-200 ease-in-out hover:translate-x-1.5 hover:bg-surface-soft active:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    SIDE_MENU_COLORS[trigger.color].background
                  )}
                >
                  {(() => {
                    const TriggerIcon = SIDE_MENU_ICONS[trigger.icon];
                    return (
                      <TriggerIcon
                        className={cn(
                          "h-[26px] w-[26px]",
                          SIDE_MENU_COLORS[trigger.color].foreground
                        )}
                        aria-hidden
                      />
                    );
                  })()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">
                    {trigger.label}
                  </span>
                  <span className="block text-[11px] font-medium text-foreground-secondary">
                    {trigger.description}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-foreground-secondary transition-transform duration-200 ease-in-out",
                    categoriesOpen && "rotate-180 text-primary"
                  )}
                  aria-hidden
                />
                        </button>
                        <div
                id="side-menu-categories"
                aria-hidden={!categoriesOpen}
                className={cn(
                  "grid overflow-hidden bg-surface-soft transition-[grid-template-rows] duration-200 ease-in-out",
                  categoriesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
                        >
                          <div className="min-h-0 overflow-hidden">
                  <div className="grid grid-cols-2 gap-2 px-5 py-3">
                    {displayedCategories.map((category, index) => {
                      const visual = CATEGORY_VISUALS[index % CATEGORY_VISUALS.length];
                      const Icon = visual.icon;
                      return (
                        <Link
                          key={category.id}
                          href={category.href}
                          tabIndex={categoriesOpen ? 0 : -1}
                          onClick={closeMenu}
                          className="flex min-h-[52px] items-center gap-2 rounded-2xl bg-surface px-3 shadow-sm transition-all duration-200 ease-in-out hover:translate-x-1 hover:bg-surface-soft active:bg-primary-soft"
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                              visual.background,
                              visual.foreground
                            )}
                          >
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="line-clamp-2 text-xs font-bold text-foreground">
                            {category.name}
                          </span>
                        </Link>
                      );
                    })}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      section.items.map((item) => {
                        const ItemIcon = SIDE_MENU_ICONS[item.icon];
                        const itemColor = SIDE_MENU_COLORS[item.color];
                        return (
                          <SideMenuItem
                            key={item.id}
                            href={item.href}
                            title={item.label}
                            description={item.description}
                            icon={ItemIcon}
                            iconBackground={itemColor.background}
                            iconColor={itemColor.foreground}
                            onNavigate={closeMenu}
                          />
                        );
                      })
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
          </div>,
          document.body
        )}
    </div>
  );
}

function SearchBar({
  className,
  id = "header-search",
  autoFocus = false,
  onSearch,
}: {
  className?: string;
  id?: string;
  autoFocus?: boolean;
  onSearch?: () => void;
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
    onSearch?.();
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)} role="search">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-red"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
        placeholder="搜尋商品、品牌或團購活動"
        className="h-10 w-full rounded-full border-[1.5px] border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-foreground-secondary focus:border-primary focus:shadow-brand-ring focus-visible:border-primary focus-visible:shadow-brand-ring"
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

function CollapsibleSearch() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="header-search-panel"
        aria-label={isOpen ? "收合搜尋" : "展開搜尋"}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink transition hover:bg-brand-blush hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div
          id="header-search-panel"
          className="absolute left-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-brand-line bg-surface p-2 shadow-xl"
        >
          <SearchBar id="header-search" autoFocus onSearch={() => setIsOpen(false)} />
        </div>
      )}
    </div>
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
  className,
}: {
  href: string;
  label: string;
  icon: typeof User;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-brand-ink transition hover:bg-brand-blush hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 md:flex-row md:gap-1.5 md:px-2.5",
        className
      )}
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
          <IconAction
            href={APP_ROUTES.orders}
            label="我的團購"
            icon={Package}
            className="hidden md:inline-flex"
          />
          <IconAction href={APP_ROUTES.profile} label="會員中心" icon={User} />
        </>
      ) : (
        <>
          <IconAction
            href={APP_ROUTES.login}
            label="我的團購"
            icon={Package}
            className="hidden md:inline-flex"
          />
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

  const cardStyles = [
    "bg-groupBuy text-white",
    "bg-primary text-white",
    "bg-warning text-foreground",
    "bg-info text-white",
  ];
  const fontStyles = {
    small: {
      value: "text-lg",
      suffix: "text-xs",
      label: "text-[9px] sm:text-[10px]",
    },
    medium: {
      value: "text-xl",
      suffix: "text-sm",
      label: "text-[10px] sm:text-[11px]",
    },
    large: {
      value: "text-2xl",
      suffix: "text-base",
      label: "text-xs sm:text-sm",
    },
  } as const;

  return (
    <div
      aria-label="團購快捷資訊"
      className="overflow-hidden"
    >
      <ul className="grid grid-cols-4 gap-1.5">
        {items.map(({ id, label, value, suffix, icon_emoji, href, font_size }, index) => {
          const typography = fontStyles[font_size ?? "medium"];
          const targetHref =
            href ??
            (id === "today" || id === "ending"
              ? "/group-buy"
              : id === "shipping"
                ? "/products"
                : undefined);
          const content = (
            <div
              className={cn(
                "relative flex min-h-[64px] min-w-0 flex-col justify-center overflow-hidden rounded-2xl px-2.5 py-2 shadow-[0_6px_14px_rgba(32,33,36,0.14)] transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
                cardStyles[index % cardStyles.length]
              )}
            >
              <span className="absolute bottom-1 right-1 text-xl opacity-35 drop-shadow-sm" aria-hidden>
                {icon_emoji || "✨"}
              </span>
              <span className="relative z-10 min-w-0">
                {value ? (
                  <span className={cn("block font-black leading-none", typography.value)}>
                    {value}
                    <span className={cn("ml-0.5", typography.suffix)}>{suffix}</span>
                  </span>
                ) : null}
                <span className={cn("mt-1 block truncate font-bold opacity-95", typography.label)}>
                  {label}
                </span>
              </span>
              {targetHref && (
                <ArrowUpRight className="absolute right-2 top-2 h-3.5 w-3.5 opacity-80" />
              )}
            </div>
          );

          return (
            <li key={id} className="min-w-0">
              {targetHref ? (
                targetHref.startsWith("http") ? (
                  <a href={targetHref} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  <Link href={targetHref}>{content}</Link>
                )
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CategoryMenuFallback() {
  return <div className="h-10 w-10 rounded-xl border border-brand-line bg-surface" />;
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
    sideMenuSections?: SideMenuSection[];
  } | null>(null);
  const [menuCategories, setMenuCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    // load from DB so header content can be managed in back-office
    fetch("/api/site-header")
      .then((r) => r.json())
      .then((d) => setSiteHeaderConfig(d ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data?.categories)) setMenuCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  const promoItems = Array.isArray(siteHeaderConfig?.promoItems)
    ? siteHeaderConfig.promoItems
    : DEFAULT_HEADER_PROMO_ITEMS;
  const sideMenuSections = Array.isArray(siteHeaderConfig?.sideMenuSections)
    ? siteHeaderConfig.sideMenuSections
    : DEFAULT_SIDE_MENU_SECTIONS;

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
      className="fixed left-0 right-0 top-0 z-50 border-b border-brand-line/80 bg-surface/95 shadow-[0_1px_0_rgba(242,222,220,0.9)] backdrop-blur-sm"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="flex flex-col gap-2 py-2.5 md:py-3">
          {/* Single row: left menu/search + centered brand + member actions */}
          <div className="grid min-h-[48px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center md:min-h-[56px]">
            <div className="flex min-w-0 items-center justify-start gap-1">
              {!isAuthPage && (
                <>
                  <Suspense fallback={<CategoryMenuFallback />}>
                    <CategoryMenu
                      categories={menuCategories}
                      sections={sideMenuSections}
                    />
                  </Suspense>
                  <Suspense fallback={<SearchFallback className="w-10" />}>
                    <CollapsibleSearch />
                  </Suspense>
                </>
              )}
            </div>

            <BrandLockup className="max-w-[150px] justify-self-center sm:max-w-none" />

            <div className="flex min-w-0 items-center justify-end gap-1">
              <AuthActions variant={authVariant} />
            </div>
          </div>

          {/* Promo strip */}
          {!isAuthPage && <QuickPromoStrip items={promoItems} />}
        </div>
      </div>
    </header>
  );
}
