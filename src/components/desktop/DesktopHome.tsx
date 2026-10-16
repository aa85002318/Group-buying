"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Clock3,
  LayoutGrid,
  MapPin,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DesktopProductCard } from "@/components/desktop/DesktopProductCard";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { DESKTOP_HERO_FALLBACK, DESKTOP_IP_ANGEL_PNG as DESKTOP_IP_ANGEL } from "@/lib/desktop/brand-assets";
import { listOrderedDesktopHomeSections } from "@/lib/home/blocks";
import { isCustomBannerHeading } from "@/lib/home/section-keys";
import { sharedJson } from "@/lib/home/shared-fetch";
import {
  articleHref,
  parseFeaturedArticleSettings,
  pickFeaturedArticles,
  type ArticleLike,
} from "@/lib/home/featured-articles";
import {
  DEFAULT_HOME_LAYOUT_SETTINGS,
  DESKTOP_SPACING_CLASS,
  normalizeHomeLayoutSettings,
  parseHomeCategorySettings,
  resolveBlockSpacing,
  type HomeLayoutSettings,
} from "@/lib/home/layout-device";
import { hotSearchHref, resolveHotSearchKeywords } from "@/lib/home/hot-search";
import { parseServiceShortcuts } from "@/lib/home/service-shortcuts";
import {
  DEFAULT_BRAND_BREATH_TITLE,
  DEFAULT_INGREDIENT_HINT,
  parseAiSection,
  parseBrandBreath,
  parseStoreB2b,
  searchPlaceholder,
} from "@/lib/home/website-home-config";
import {
  GROUP_BUY_CONSUMER_VISIBLE,
  HIDDEN_HOME_GROUP_BUY_KEYS,
  isGroupBuyConsumerHref,
} from "@/lib/features/group-buy-visibility";
import type { HomepageBlock } from "@/lib/types/database";
import { parseQuickServicesSettings } from "@/types/home-quick-service";
import { parseLatestCampaignSettings } from "@/types/home-latest-campaign";
import { HomepagePopupDialog } from "@/components/home/HomepagePopupDialog";
import { HomeGroupBuyBannerSection } from "@/components/home/group-buy-banner/HomeGroupBuyBannerSection";
import {
  ChimeSelectGroupBuySection,
  ClosingGroupBuysSection,
  WeeklyGroupBuysSection,
  WeeklyLiveStreamsSection,
} from "@/components/home/group-buy-hub/HomeGroupBuySections";
import { APP_ROUTES, productPath } from "@/lib/site-links";
import { cn } from "@/lib/utils";

type Banner = {
  id: string;
  title?: string | null;
  image_url?: string | null;
  desktop_image_url?: string | null;
  mobile_image_url?: string | null;
  link_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  placement?: string | null;
  banner_type?: string | null;
};

type Product = {
  id: string;
  name: string;
  price?: number | null;
  sale_price?: number | null;
  website_price?: number | null;
  image_url?: string | null;
  unit?: string | null;
  spec?: string | null;
  specification?: string | null;
  package_spec?: string | null;
  is_hot?: boolean | null;
  is_new?: boolean | null;
  product_categories?: { name?: string | null; slug?: string | null } | null;
};

type Recipe = {
  id: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  description?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  difficulty?: string | null;
  prep_time?: number | null;
  cook_time?: number | null;
  total_time?: number | null;
};

type StoreRow = {
  id: string;
  name?: string | null;
  address?: string | null;
  cover_image_url?: string | null;
  image_url?: string | null;
};

/** 後台「商品分類」的資料（含排序與圖示）。 */
type AdminCategory = {
  id: string;
  name: string;
  slug?: string | null;
  sort_order?: number | null;
  icon_url?: string | null;
  shop_home_icon?: string | null;
  shop_home_bg_color?: string | null;
  custom_link?: string | null;
  show_on_shop_home?: boolean | null;
};

type HomeCategory = { id: string; name: string; href: string; image?: string; bgColor?: string };

const DIFFICULTY: Record<string, string> = { easy: "初階", medium: "進階", hard: "挑戰" };

const NAVY = "#153E73";

function bannerImage(b: Banner) {
  return b.desktop_image_url || b.image_url || b.mobile_image_url || null;
}
function productPrice(p: Product) {
  return Number(p.sale_price ?? p.website_price ?? p.price ?? 0);
}
function productSpec(p: Product) {
  return p.spec || p.specification || p.package_spec || p.unit || null;
}
function str(v: unknown) {
  return typeof v === "string" ? v : "";
}
/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

/** Every section shares one content edge. */
const CONTENT_MAX = "max-w-[1280px]";

type BandTone = "white" | "warm" | "soft" | "cream" | "sky";
const BAND_BG: Record<BandTone, string> = {
  white: "bg-white",
  warm: "bg-[#FFFEFA]",
  soft: "bg-[#FFF9EC]",
  cream: "bg-[#FFF5CC]",
  sky: "bg-[#EEF8FC]",
};
/** Two neighbouring bands add up to ~48px (phone) / 72–80px (desktop) between sections. */
const BAND_PAD = {
  normal: "py-6 md:py-9 lg:py-10",
  compact: "py-4 md:py-6",
  none: "",
} as const;

/** Spacing the editor chose for the section being rendered (後台 › 版面 › 間距). */
const SectionSpacing = createContext<string | undefined>(undefined);

/** Sections that paint their own background and don't join the warm / soft alternation. */
const SELF_TONED: Partial<Record<string, BandTone>> = {
  hero: "warm",
  hot_searches: "warm",
  brand_statement: "cream",
  ai_assistant: "sky",
};

function alternateTones(sections: Array<{ id: string; key: string }>) {
  const tones = new Map<string, BandTone>();
  let last: BandTone = "warm";
  sections.forEach((s, i) => {
    const own = SELF_TONED[s.key];
    if (own) {
      last = own;
      return;
    }
    // 一鍵買齊材料 continues the recipe band right above it.
    if (s.key === "ingredient_shop" && sections[i - 1]?.key === "latest_recipes") {
      tones.set(s.id, last);
      return;
    }
    const tone: BandTone = last === "soft" || last === "cream" ? "warm" : "soft";
    tones.set(s.id, tone);
    last = tone;
  });
  return tones;
}

function Band({
  tone = "warm",
  pad = "normal",
  label,
  className,
  children,
}: {
  tone?: BandTone;
  pad?: keyof typeof BAND_PAD;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const spacing = useContext(SectionSpacing);
  return (
    <section
      aria-label={label}
      className={cn(BAND_BG[tone], spacing ?? BAND_PAD[pad], className)}
    >
      <DesktopContainer className={CONTENT_MAX}>{children}</DesktopContainer>
    </section>
  );
}

function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "查看全部",
  ctaStyle = "link",
}: {
  title: string;
  subtitle?: string | null;
  href?: string | null;
  linkLabel?: string;
  /** Match 「精選烘焙材料」: plain title, optional red pill CTA. */
  ctaStyle?: "link" | "button";
}) {
  return (
    <div
      className={cn(
        "mb-3.5 flex gap-3 md:mb-[18px]",
        ctaStyle === "button"
          ? "flex-col sm:flex-row sm:items-end sm:justify-between"
          : "items-start justify-between"
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[22px] font-bold leading-[1.25] text-[#153E73] md:text-[28px]">{title}</h2>
        {subtitle ? (
          <p className="mt-1.5 line-clamp-2 text-[13px] text-[#687386] md:line-clamp-1 md:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>
      {href ? (
        ctaStyle === "button" ? (
          <Link
            href={href}
            className="inline-flex h-11 w-fit shrink-0 items-center gap-1.5 rounded-full bg-[#F16458] px-5 text-sm font-bold text-white hover:brightness-95"
          >
            {linkLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <Link
            href={href}
            className="mt-1 inline-flex shrink-0 items-center gap-0.5 text-[14px] font-bold text-[#153E73] hover:text-[#F16458] md:mt-2"
          >
            {linkLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )
      ) : null}
    </div>
  );
}

/** Cards visible on a screen size: whole rows only (all of them if fewer than one row). */
function fullRows(count: number, perRow: number) {
  return count < perRow ? count : Math.floor(count / perRow) * perRow;
}

const GRID_LAYOUT = {
  /** Products (dense): phone 2 · tablet 4 · desktop 5; at most 4 rows on phones */
  products: {
    cls: "grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4 lg:grid-cols-5 lg:gap-5",
    phone: 2,
    tablet: 4,
    desktop: 5,
    phoneMax: 8,
  },
  /** Recipes stay large: phone 2 · tablet / desktop 3 */
  recipes: {
    cls: "grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:gap-6",
    phone: 2,
    tablet: 3,
    desktop: 3,
    phoneMax: Infinity,
  },
} as const;

/** Homepage product sections load enough for two full desktop rows. */
const HOME_PRODUCT_COUNT = 10;

/**
 * Fixed-column card grid. Cards that would leave a short last row on the
 * current screen size are hidden there, so every row is full.
 */
function CardGrid({ layout, children }: { layout: keyof typeof GRID_LAYOUT; children: ReactNode[] }) {
  const g = GRID_LAYOUT[layout];
  const n = children.length;
  const phone = fullRows(Math.min(n, g.phoneMax), g.phone);
  const tablet = fullRows(n, g.tablet);
  const desktop = fullRows(n, g.desktop);
  return (
    <div className={cn("grid", g.cls)}>
      {children.map((child, i) => (
        <div
          key={i}
          className={cn(
            "min-w-0",
            i >= phone && "max-md:hidden",
            i >= tablet && "md:max-lg:hidden",
            i >= desktop && "lg:hidden"
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

function ProductTile({ p }: { p: Product }) {
  return (
    <DesktopProductCard
      id={p.id}
      name={p.name}
      price={productPrice(p)}
      image_url={p.image_url}
      spec={productSpec(p)}
      href={productPath(p.id)}
      compact
      className="h-full shadow-[0_2px_10px_rgba(21,62,115,0.07)]"
    />
  );
}

type DesktopSection = ReturnType<typeof listOrderedDesktopHomeSections>[number];

/**
 * Website home — one responsive layout for phones, tablets and computers.
 *
 * Renders the SAME homepage_blocks list the editor manages (後台 › 頁面編輯 ›
 * 首頁). Section order follows the approved 首頁效果圖 until an editor saves
 * a layout with the new blocks, after which the editor order is used.
 */
export function DesktopHome() {
  const router = useRouter();
  const [sections, setSections] = useState<DesktopSection[] | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [fresh, setFresh] = useState<Product[]>([]);
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [store, setStore] = useState<StoreRow | null>(null);
  const [query, setQuery] = useState("");
  const [draftPreview, setDraftPreview] = useState(false);
  const [layout, setLayout] = useState<HomeLayoutSettings>(DEFAULT_HOME_LAYOUT_SETTINGS);
  const [allCategories, setAllCategories] = useState<AdminCategory[]>([]);
  const [articles, setArticles] = useState<ArticleLike[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Admin Page Builder loads the storefront with ?preview=draft.
    const previewDraft =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview") === "draft";
    setDraftPreview(previewDraft);
    // 和 App 版共用同一份結果，換版型時不會再把同一支 API 叫第二次。
    const safe = (url: string) =>
      sharedJson<Record<string, unknown>>(url, { credentials: "include" });
    Promise.all([
      safe(previewDraft ? "/api/cms?preview=draft" : "/api/cms"),
      safe("/api/products"),
      safe("/api/recipes"),
      safe("/api/stores?channel=website"),
      safe("/api/shop/popular-products?limit=12"),
      safe("/api/shop/new-products?limit=12"),
      safe("/api/shop/home-categories"),
      safe("/api/home-layout-settings"),
      safe("/api/categories"),
      safe("/api/articles"),
    ]).then(([cms, prod, rec, stores, pop, neu, cats, layoutSettings, allCats, arts]) => {
      if (cancelled) return;
      setSections(listOrderedDesktopHomeSections((cms.blocks as HomepageBlock[]) ?? []));
      setLayout(
        layoutSettings?.settings
          ? normalizeHomeLayoutSettings(layoutSettings.settings)
          : DEFAULT_HOME_LAYOUT_SETTINGS
      );
      setBanners((cms.banners as Banner[]) ?? []);
      setProducts((prod.products as Product[]) ?? []);
      setRecipes((rec.recipes as Recipe[]) ?? []);
      setPopular((pop.products as Product[]) ?? []);
      setFresh((neu.products as Product[]) ?? []);
      setAllCategories(((allCats?.categories ?? []) as AdminCategory[]) ?? []);
      setArticles(((arts?.articles ?? []) as ArticleLike[]) ?? []);
      setCategories(
        ((cats.categories as HomeCategory[]) ?? []).filter((c) => c.name && c.name !== "全部分類")
      );
      const list = (stores.stores as StoreRow[]) ?? [];
      setStore(list.find((s) => (s.name || "").includes("大安")) ?? list[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** 「本月新品」沒有勾選任何新品時，就照上架時間新到舊自動帶。 */
  const newestProducts = useMemo(() => {
    const at = (p: Product) =>
      String((p as Product & { created_at?: string | null }).created_at ?? "");
    return [...products].sort((a, b) => at(b).localeCompare(at(a)));
  }, [products]);

  const heroBanners = useMemo(() => {
    const active = banners.filter((b) => b.is_active !== false && bannerImage(b));
    const preferred = active.filter(
      (b) => b.placement === "desktop_home_hero" || b.banner_type === "desktop_home_hero"
    );
    return (preferred.length ? preferred : active).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  }, [banners]);

  const [heroIndex, setHeroIndex] = useState(0);
  const heroBanner = heroBanners[heroIndex] ?? heroBanners[0] ?? null;
  const heroSrc = (heroBanner && bannerImage(heroBanner)) || DESKTOP_HERO_FALLBACK;

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const t = window.setInterval(() => setHeroIndex((i) => (i + 1) % heroBanners.length), 6000);
    return () => window.clearInterval(t);
  }, [heroBanners.length]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const pickManual = (ids: string[]) =>
    ids.map((id) => productById.get(id)).filter((p): p is Product => Boolean(p));

  const pickRecipes = (section: DesktopSection) => {
    if (section.sourceMode === "manual" && section.manualIds.length) {
      const byId = new Map(recipes.map((r) => [r.id, r]));
      const picked = section.manualIds.map((id) => byId.get(id)).filter((r): r is Recipe => Boolean(r));
      if (picked.length) return picked;
    }
    return recipes;
  };

  const renderSection = (section: DesktopSection, prevKey: string | null, tone: BandTone): ReactNode => {
    // Group-buy sections stay hidden while FEATURES.groupBuying is off.
    if (!GROUP_BUY_CONSUMER_VISIBLE && HIDDEN_HOME_GROUP_BUY_KEYS.has(section.key)) return null;
    const cfg = section.config ?? {};
    const cols = section.desktop.columns;

    switch (section.key) {
      /* 主視覺：圖片＋連結 */
      case "hero":
        return (
          <Band key={section.id} tone="warm" pad="none" label={section.title || "主視覺"} className="pt-[clamp(12px,2vw,24px)]">
            <h1 className="sr-only">CHIMEIDIY 烘焙材料｜烘焙生活平台</h1>
            {/* Desktop 5:2. Phones use the 6:5 phone image; without one they keep 5:2 so the desktop art isn't cropped. */}
            <Link
              href={heroBanner?.link_url || APP_ROUTES.shop}
              className={cn(
                "relative block w-full overflow-hidden rounded-[14px] bg-[#EEF8FC] md:rounded-[20px]",
                heroBanner?.mobile_image_url ? "aspect-[6/5] md:aspect-[5/2]" : "aspect-[5/2]"
              )}
            >
              <picture>
                {heroBanner?.mobile_image_url ? (
                  <source media="(max-width: 767px)" srcSet={heroBanner.mobile_image_url} />
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroSrc}
                  alt={heroBanner?.title || "CHIMEIDIY"}
                  className="absolute inset-0 h-full w-full object-cover"
                  fetchPriority="high"
                />
              </picture>
            </Link>
            {heroBanners.length > 1 ? (
              <div className="mt-3 flex justify-center gap-2">
                {heroBanners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-label={`第 ${i + 1} 張主視覺`}
                    onClick={() => setHeroIndex(i)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === heroIndex ? "w-6 bg-[#153E73]" : "w-2 bg-[#C9D3E3]"
                    )}
                  />
                ))}
              </div>
            ) : null}
          </Band>
        );

      /* 搜尋列＋熱門搜尋 */
      case "hot_searches": {
        const keywords = resolveHotSearchKeywords(cfg).slice(0, Math.max(1, section.displayCount || 8));
        return (
          <Band key={section.id} tone="warm" pad="compact" label="搜尋">
            <form
              role="search"
              className="mx-auto flex h-[clamp(48px,4vw,58px)] w-full max-w-[760px] items-center gap-2 rounded-full bg-white pl-4 pr-1.5 shadow-[0_8px_28px_rgba(21,62,115,0.12)] sm:pl-6"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                router.push(q ? `${APP_ROUTES.search}?q=${encodeURIComponent(q)}` : APP_ROUTES.shop);
              }}
            >
              <Search className="h-5 w-5 shrink-0 text-[#153E73]" aria-hidden />
              <label className="min-w-0 flex-1">
                <span className="sr-only">搜尋</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder(cfg)}
                  className="w-full bg-transparent text-[clamp(14px,1.2vw,17px)] text-[#153E73] outline-none placeholder:text-[#7A869A]"
                />
              </label>
              <button
                type="submit"
                className="hidden h-[calc(100%-12px)] shrink-0 items-center rounded-full bg-[#153E73] px-6 text-[15px] font-bold text-white sm:inline-flex"
              >
                搜尋
              </button>
            </form>
            {keywords.length ? (
              <div className="mt-5 flex items-center gap-2 md:justify-center">
                <span className="hidden shrink-0 text-sm font-bold text-[#4A5B78] md:inline">
                  {section.title && section.title !== "搜尋列與熱門搜尋" ? section.title : "熱門搜尋"}
                </span>
                <ul className="scrollbar-hide -mr-4 flex gap-2 overflow-x-auto pr-4 md:mr-0 md:flex-wrap md:justify-center md:overflow-visible md:pr-0">
                  {keywords.map((k) => (
                    <li key={k.id} className="shrink-0">
                      <Link
                        href={hotSearchHref(k)}
                        className="inline-flex h-9 items-center rounded-full border border-[#E5DDC4] bg-white px-4 text-sm text-[#153E73] hover:border-[#FFD454] hover:bg-[#FFF5CC]"
                      >
                        {k.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Band>
        );
      }

      /* 商品分類（後台 › 商城分類） */
      case "popular_categories":
      case "custom_categories": {
        const catCfg = parseHomeCategorySettings(cfg);
        const byId = new Map(allCategories.map((c) => [c.id, c]));
        const toTile = (c: AdminCategory): HomeCategory => ({
          id: c.id,
          name: c.name,
          href: c.custom_link?.trim() || `/shop/category/${c.slug ?? c.id}`,
          image: c.shop_home_icon || c.icon_url || undefined,
          bgColor: c.shop_home_bg_color || "#FFF5CC",
        });
        // 後台挑選的分類優先；沒挑過就沿用「顯示在商城首頁」的設定。
        const picked = catCfg.items
          .filter((i) => i.enabled)
          .map((i) => byId.get(i.id))
          .filter((c): c is AdminCategory => Boolean(c))
          .map(toTile);
        const fallback = categories.length
          ? categories
          : allCategories
              .filter((c) => c.show_on_shop_home !== false)
              .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
              .map(toTile);
        const base = picked.length ? picked : fallback;
        const tiles: HomeCategory[] = base.slice(0, catCfg.maxItems);
        if (catCfg.showAllTile) {
          tiles.push({ id: "__all", name: "全部分類", href: "/shop/categories", bgColor: "#EEF8FC" });
        }
        if (!tiles.length) return null;
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <SectionHeading
              title={section.title || "商品分類"}
              subtitle={section.subtitle}
              href={section.viewAllUrl || APP_ROUTES.shop}
              linkLabel="全部商品"
            />
            <ul
              className={cn(
                "grid gap-x-3 gap-y-4 md:gap-x-5 md:gap-y-6",
                catCfg.showIcons
                  ? "grid-cols-4 lg:grid-cols-8"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
              )}
            >
              {tiles.map((c) => (
                <li key={c.id}>
                  {catCfg.showIcons ? (
                    <Link href={c.href} className="group flex flex-col items-center gap-2 text-center">
                      <span
                        className="relative flex aspect-square w-full max-w-[112px] items-center justify-center overflow-hidden rounded-full shadow-[0_4px_14px_rgba(21,62,115,0.10)] transition group-hover:-translate-y-0.5"
                        style={{ background: c.bgColor || "#FFF5CC" }}
                      >
                        {c.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
                        ) : c.id === "__all" ? (
                          <LayoutGrid className="h-[38%] w-[38%] text-[#153E73]" strokeWidth={1.7} aria-hidden />
                        ) : (
                          <Sparkles className="h-[38%] w-[38%] text-[#153E73]" strokeWidth={1.7} aria-hidden />
                        )}
                      </span>
                      <span className="line-clamp-2 min-h-[2.5em] text-[13px] font-bold leading-[1.25] text-[#153E73] md:text-[15px]">
                        {c.name}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href={c.href}
                      className="flex h-12 items-center justify-center rounded-full bg-white px-3 text-center text-[14px] font-bold text-[#153E73] shadow-[0_2px_10px_rgba(21,62,115,0.07)] transition hover:-translate-y-0.5 md:text-[15px]"
                    >
                      <span className="line-clamp-1">{c.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Band>
        );
      }

      /* 最新活動 Banner（5:2，圖片＋連結） */
      case "latest_campaigns": {
        const settings = parseLatestCampaignSettings(cfg);
        const slides = settings.slides
          .filter((s) => s.enabled && s.imageUrl)
          .filter(
            (s) =>
              GROUP_BUY_CONSUMER_VISIBLE ||
              !(isGroupBuyConsumerHref(s.href) || s.href === "/live" || s.href.startsWith("/live/"))
          )
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, Math.max(1, section.displayCount || 6));
        if (!slides.length) return null;
        const perRow = Math.min(3, cols ?? 2);
        const viewAll =
          section.viewAllUrl && (GROUP_BUY_CONSUMER_VISIBLE || !isGroupBuyConsumerHref(section.viewAllUrl))
            ? section.viewAllUrl
            : APP_ROUTES.promotions;
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <SectionHeading title={section.title || "最新活動"} subtitle={section.subtitle} href={viewAll} linkLabel="所有活動" />
            <div
              className={cn(
                "scrollbar-hide -mx-4 flex scroll-px-4 sm:scroll-px-6 snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:gap-5 lg:gap-6",
                "md:mx-0 md:grid md:overflow-visible md:px-0",
                perRow === 3 ? "md:grid-cols-2 lg:grid-cols-3" : perRow === 1 ? "md:grid-cols-1" : "md:grid-cols-2"
              )}
            >
              {slides.map((s) => (
                <Link
                  key={s.id}
                  href={s.href || APP_ROUTES.promotions}
                  className="group relative block aspect-[5/2] w-[86%] shrink-0 snap-start overflow-hidden rounded-[14px] bg-[#EEF8FC] md:w-auto md:rounded-[18px]"
                >
                  <Image
                    src={s.imageUrl}
                    alt={s.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(min-width:768px) 50vw, 86vw"
                  />
                </Link>
              ))}
            </div>
          </Band>
        );
      }

      /* 精選活動：後台「文章管理」的活動文章，輪播顯示 */
      case "featured_articles": {
        const picked = pickFeaturedArticles(
          articles,
          parseFeaturedArticleSettings(cfg),
          section.displayCount || 6
        );
        if (!picked.length) return null;
        const perRow = Math.min(3, cols ?? 3);
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <SectionHeading
              title={section.title || "精選活動"}
              subtitle={section.subtitle}
              href={section.viewAllUrl || "/articles"}
              linkLabel="所有活動"
            />
            <div
              className={cn(
                "scrollbar-hide -mx-4 flex scroll-px-4 snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:gap-5 lg:gap-6",
                "md:mx-0 md:grid md:overflow-visible md:px-0",
                perRow === 3 ? "md:grid-cols-2 lg:grid-cols-3" : perRow === 1 ? "md:grid-cols-1" : "md:grid-cols-2"
              )}
            >
              {picked.map((a) => (
                <Link
                  key={a.id}
                  href={articleHref(a)}
                  className="group block w-[86%] shrink-0 snap-start overflow-hidden rounded-[14px] bg-white md:w-auto md:rounded-[18px]"
                >
                  <span className="relative block aspect-[5/2] w-full overflow-hidden bg-[#EEF8FC]">
                    {a.cover_image ? (
                      <Image
                        src={a.cover_image}
                        alt={a.title ?? ""}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        sizes="(min-width:768px) 33vw, 86vw"
                      />
                    ) : null}
                  </span>
                  <span className="block px-3 py-2.5 md:px-4 md:py-3">
                    <span className="line-clamp-2 block text-[15px] font-bold leading-snug text-[#153E73] md:text-base">
                      {a.title}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Band>
        );
      }

      /* 熱門商品 / 新品上架 / 精選商品 */
      case "popular_baking_products":
      case "weekly_new_products":
      case "custom_products": {
        const manual = section.manualIds.length ? pickManual(section.manualIds) : [];
        // Shop rails API first; if it returns nothing, fall back to the
        // products flagged 熱門 / 新品 in 商品管理.
        const auto =
          section.key === "popular_baking_products"
            ? popular.length
              ? popular
              : products.filter((p) => p.is_hot)
            : section.key === "weekly_new_products"
              ? fresh.length
                ? fresh
                : products.filter((p) => p.is_new).length
                  ? products.filter((p) => p.is_new)
                  : newestProducts
              : [];
        const source = section.key === "custom_products" || (section.sourceMode === "manual" && manual.length) ? manual : auto;
        const list = source.slice(0, Math.max(HOME_PRODUCT_COUNT, section.displayCount || 0));
        if (!list.length) return null;
        const fallbackHref =
          section.key === "popular_baking_products"
            ? "/shop/popular"
            : section.key === "weekly_new_products"
              ? "/shop/new-arrivals"
              : null;
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <SectionHeading
              title={section.title}
              subtitle={section.subtitle}
              href={section.viewAllUrl || fallbackHref}
            />
            <CardGrid layout="products">
              {list.map((p) => (
                <ProductTile key={p.id} p={p} />
              ))}
            </CardGrid>
          </Band>
        );
      }

      /* 精選食譜 */
      case "latest_recipes":
      case "custom_recipes": {
        const picked = pickRecipes(section);
        const list = picked.slice(0, Math.max(2, section.displayCount || 3));
        if (!list.length) return null;
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <SectionHeading
              title={section.title || "精選食譜"}
              subtitle={section.subtitle}
              href={section.viewAllUrl || APP_ROUTES.recipes}
              linkLabel="更多食譜"
            />
            <CardGrid layout="recipes">
              {list.map((r) => {
                const cover = r.cover_image_url || r.cover_image;
                const mins = r.total_time ?? r.prep_time ?? r.cook_time;
                const href = `/recipes/${r.slug || r.id}`;
                const intro = r.summary || r.description;
                return (
                  <article key={r.id} className="flex h-full flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_2px_12px_rgba(21,62,115,0.08)] md:rounded-[18px]">
                    <Link href={href} className="relative block aspect-[4/3] bg-[#EEF8FC]">
                      {cover ? (
                        <Image src={cover} alt={r.title} fill className="object-cover" sizes="(min-width:768px) 33vw, 50vw" />
                      ) : null}
                      <span className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
                        <FavoriteButton targetType="recipe" targetId={r.id} size="sm" />
                      </span>
                    </Link>
                    <div className="flex flex-1 flex-col gap-1.5 p-3 md:gap-2 md:p-5">
                      <Link
                        href={href}
                        className="line-clamp-2 min-h-[2.5em] text-[15px] font-black leading-[1.25] text-[#153E73] md:text-[18px]"
                      >
                        {r.title}
                      </Link>
                      <p className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#4A5B78] md:gap-x-4 md:text-[13px]">
                        {mins != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" aria-hidden />
                            {mins} 分鐘
                          </span>
                        ) : null}
                        {r.difficulty ? (
                          <span className="inline-flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" aria-hidden />
                            {DIFFICULTY[r.difficulty] ?? r.difficulty}
                          </span>
                        ) : null}
                      </p>
                      {intro ? (
                        <p className="line-clamp-2 hidden text-[13px] leading-relaxed text-[#4A5B78] md:block">{intro}</p>
                      ) : null}
                      <Link href={href} className="mt-auto inline-flex items-center gap-1 pt-1 text-[13px] font-bold text-[#F16458] md:text-sm">
                        查看食譜
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </CardGrid>
          </Band>
        );
      }

      /* 一鍵買齊材料（緊接在食譜下方） */
      case "ingredient_shop": {
        const manual = section.sourceMode === "manual" ? pickManual(section.manualIds) : [];
        const slugs = Array.isArray(cfg.category_slugs) ? (cfg.category_slugs as string[]) : [];
        const bySlug = slugs.length
          ? products.filter((p) => p.product_categories?.slug && slugs.includes(p.product_categories.slug))
          : [];
        const source = manual.length ? manual : bySlug.length >= 4 ? bySlug : products;
        const list = source.slice(0, HOME_PRODUCT_COUNT);
        const subtitle = section.subtitle || str(cfg.subtitle) || "完整食材一次購足，讓烘焙更輕鬆！";
        const hint = cfg.hint_enabled === false ? "" : str(cfg.hint_text) || DEFAULT_INGREDIENT_HINT;
        const afterRecipes = prevKey === "latest_recipes";
        return (
          <Band key={section.id} tone={tone} label={section.title} className={afterRecipes ? "pt-0 md:pt-0 lg:pt-0" : undefined}>
            {afterRecipes && hint ? (
              <p className="mb-4 text-center text-[15px] font-bold text-[#153E73] md:mb-6 md:text-[17px]">{hint}</p>
            ) : null}
            <SectionHeading
              title={section.title || "精選烘焙材料"}
              subtitle={subtitle}
              href={section.viewAllUrl || APP_ROUTES.shop}
              linkLabel="全部商品"
              ctaStyle="button"
            />
            {list.length ? (
              <div className="rounded-[16px] border border-[#F3E9C6] bg-[#FFF5CC]/60 p-4 md:rounded-[20px] md:p-6 lg:p-8">
                <CardGrid layout="products">
                  {list.map((p) => (
                    <ProductTile key={p.id} p={p} />
                  ))}
                </CardGrid>
              </div>
            ) : null}
          </Band>
        );
      }

      /* 品牌呼吸過渡區：購物 → 靈感 */
      case "brand_statement": {
        const bb = parseBrandBreath(cfg);
        const title =
          section.title && section.title !== "品牌定位" ? section.title : DEFAULT_BRAND_BREATH_TITLE;
        return (
          <section
            key={section.id}
            aria-label={title}
            className="overflow-hidden bg-[#FFF5CC]"
          >
            <DesktopContainer
              className={cn(
                CONTENT_MAX,
                "flex flex-col items-center gap-6 py-10 md:flex-row md:justify-between md:gap-10 md:py-14"
              )}
            >
              <div className="flex max-w-[620px] flex-col items-center gap-[clamp(10px,1.4vw,18px)] text-center md:items-start md:text-left">
                <span className="text-[clamp(12px,1vw,14px)] font-bold uppercase tracking-[0.2em] text-[#F16458]">
                  {bb.eyebrow}
                </span>
                <h2 className="text-[clamp(28px,3.6vw,52px)] font-black leading-tight text-[#153E73]">{title}</h2>
                <p className="whitespace-pre-line text-[clamp(15px,1.3vw,19px)] leading-relaxed text-[#36507A]">{bb.body}</p>
                <Link
                  href={bb.href}
                  className="mt-2 inline-flex h-12 items-center gap-2 rounded-full bg-[#153E73] px-7 text-[15px] font-bold text-white hover:brightness-110"
                >
                  {bb.buttonText}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              {bb.imageUrl ? (
                <div className="relative aspect-[220/142] w-[min(56vw,240px)] shrink-0 md:w-[clamp(220px,24vw,340px)]">
                  <Image src={bb.imageUrl} alt="" fill className="object-contain" sizes="(min-width:768px) 24vw, 56vw" />
                </div>
              ) : null}
            </DesktopContainer>
          </section>
        );
      }

      /* AI 烘焙小幫手：大型情境區（60 / 40） */
      case "ai_assistant": {
        const ai = parseAiSection(cfg);
        return (
          <Band key={section.id} tone="sky" label={section.title}>
            <div className="grid items-center gap-[clamp(20px,4vw,64px)] md:grid-cols-[3fr_2fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[clamp(18px,2.2vw,28px)] bg-white md:aspect-[5/4]">
                <Image src={ai.sceneImageUrl} alt="" fill className="object-cover" sizes="(min-width:768px) 58vw, 100vw" />
              </div>
              <div className="relative flex flex-col gap-[clamp(10px,1.4vw,16px)]">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#153E73]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {ai.badge}
                </span>
                <h2 className="text-[clamp(28px,3.4vw,46px)] font-black leading-tight text-[#153E73]">
                  {section.title || "AI 烘焙小幫手"}
                </h2>
                {ai.lead ? <p className="text-[clamp(17px,1.6vw,22px)] font-bold text-[#153E73]">{ai.lead}</p> : null}
                <p className="whitespace-pre-line text-[clamp(14px,1.2vw,17px)] leading-relaxed text-[#36507A]">{ai.body}</p>
                {ai.chips.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {ai.chips.map((c) => (
                      <li key={c} className="rounded-full border border-[#CFE7F3] bg-white px-3.5 py-1.5 text-sm text-[#153E73]">
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-2 flex items-end justify-between gap-4">
                  <Link
                    href={ai.href}
                    className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#153E73] px-7 text-[15px] font-bold text-white hover:brightness-110"
                  >
                    {ai.buttonText}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  {ai.imageUrl ? (
                    <div className="relative aspect-[656/552] w-[40%] max-w-[180px]">
                      <Image src={ai.imageUrl} alt="" fill className="object-contain object-bottom" sizes="180px" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Band>
        );
      }

      /* 大安門市＋企業採購：兩張大型圖片卡（圖約 60%） */
      case "store_information": {
        const sb = parseStoreB2b(cfg);
        const photo = sb.store.imageUrl || store?.cover_image_url || store?.image_url || "";
        const card =
          "flex h-full flex-col overflow-hidden rounded-[clamp(18px,2vw,24px)] bg-white shadow-[0_4px_18px_rgba(21,62,115,0.08)]";
        const media = "relative aspect-[16/10] w-full shrink-0 overflow-hidden";
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <div className={cn("grid gap-3 md:gap-5 lg:gap-6", sb.b2b.enabled && "md:grid-cols-2")}>
              <article className={card}>
                <div className={cn(media, "bg-[#FFF5CC]")}>
                  {photo ? (
                    <Image src={photo} alt={sb.store.name} fill className="object-cover" sizes="(min-width:768px) 50vw, 100vw" />
                  ) : (
                    <Image src={DESKTOP_IP_ANGEL} alt="" fill className="object-contain p-[8%]" sizes="(min-width:768px) 40vw, 80vw" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-[clamp(20px,2.4vw,32px)]">
                  <span className="text-[13px] font-bold text-[#F16458]">{sb.store.eyebrow}</span>
                  <h2 className="text-[clamp(22px,2.2vw,30px)] font-black text-[#153E73]">{sb.store.name}</h2>
                  <p className="flex gap-1.5 text-[clamp(14px,1.2vw,16px)] leading-relaxed text-[#36507A]">
                    <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />
                    {sb.store.address}
                  </p>
                  {sb.store.tags.length ? (
                    <ul className="flex flex-wrap gap-2">
                      {sb.store.tags.map((t) => (
                        <li key={t} className="rounded-full bg-[#FFF5CC] px-3.5 py-1 text-sm font-bold text-[#153E73]">
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Link href={sb.store.href} className="mt-auto inline-flex items-center gap-1.5 pt-2 text-[15px] font-bold text-[#153E73] hover:text-[#F16458]">
                    {sb.store.linkText}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </article>
              {sb.b2b.enabled ? (
                <article className={card}>
                  <div className={cn(media, "bg-[#EEF8FC]")}>
                    {sb.b2b.imageUrl ? (
                      <Image src={sb.b2b.imageUrl} alt={sb.b2b.title} fill className="object-cover" sizes="(min-width:768px) 50vw, 100vw" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-[clamp(20px,2.4vw,32px)]">
                    <span className="text-[13px] font-bold text-[#F16458]">{sb.b2b.eyebrow}</span>
                    <h2 className="text-[clamp(22px,2.2vw,30px)] font-black text-[#153E73]">{sb.b2b.title}</h2>
                    {sb.b2b.tags.length ? (
                      <ul className="flex flex-wrap gap-2">
                        {sb.b2b.tags.map((t) => (
                          <li key={t} className="rounded-full bg-[#EEF8FC] px-3.5 py-1 text-sm font-bold text-[#153E73]">
                            {t}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {sb.b2b.note ? (
                      <p className="flex items-center gap-2 text-[clamp(14px,1.2vw,16px)] text-[#36507A]">
                        <Truck className="h-5 w-5 text-[#153E73]" aria-hidden />
                        {sb.b2b.note}
                      </p>
                    ) : null}
                    <Link
                      href={sb.b2b.href}
                      className="mt-auto inline-flex h-12 w-fit items-center gap-1.5 rounded-full px-6 text-[15px] font-bold text-white hover:brightness-110"
                      style={{ background: NAVY }}
                    >
                      {sb.b2b.buttonText}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </article>
              ) : null}
            </div>
          </Band>
        );
      }

      /* 快捷服務（圖片內含文字時不重複顯示） */
      case "service_shortcuts": {
        const items = parseServiceShortcuts(cfg)
          .filter((i) => i.enabled !== false && (GROUP_BUY_CONSUMER_VISIBLE || !isGroupBuyConsumerHref(i.href)))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, 8);
        if (!items.length) return null;
        return (
          <Band key={section.id} tone={tone} label={section.title || "快捷服務"}>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 lg:gap-6">
              {items.map((item) => {
                const labelled = item.labelsInImage !== false && Boolean(item.imageUrl);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href || "#"}
                      aria-label={item.title}
                      className="flex h-full flex-col items-center gap-2 overflow-hidden rounded-[clamp(14px,1.6vw,20px)] bg-white p-2 text-center shadow-[0_2px_10px_rgba(21,62,115,0.06)] transition hover:-translate-y-0.5"
                      style={{ background: item.backgroundColor || "#FFFFFF" }}
                    >
                      {item.imageUrl ? (
                        <span className="relative block aspect-square w-full max-w-[220px]">
                          <Image src={item.imageUrl} alt="" fill className="object-contain" sizes="(min-width:768px) 20vw, 45vw" />
                        </span>
                      ) : null}
                      {!labelled ? (
                        <span className="pb-2">
                          <span className="block text-[15px] font-black text-[#153E73]">{item.title}</span>
                          {item.subtitle ? <span className="block text-xs text-[#687386]">{item.subtitle}</span> : null}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Band>
        );
      }

      /* 常用服務（預設不顯示在網站，可在後台開啟） */
      case "quick_entry": {
        const qs = parseQuickServicesSettings(cfg);
        const items = qs.items
          .filter((i) => i.enabled !== false && (GROUP_BUY_CONSUMER_VISIBLE || !isGroupBuyConsumerHref(i.href)))
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (!items.length) return null;
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <SectionHeading title={section.title || qs.title || "常用服務"} href={qs.allServicesHref || null} />
            <ul className="grid grid-cols-4 gap-3 lg:grid-cols-8">
              {items.slice(0, 16).map((item) => (
                <li key={item.id}>
                  <Link href={item.href || "#"} className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center transition hover:shadow-sm">
                    <span
                      className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full"
                      style={{ background: item.backgroundColor || "#FFF5CC" }}
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-9 w-9 object-contain" />
                      ) : null}
                    </span>
                    <span className="text-sm font-semibold text-[#153E73]">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Band>
        );
      }

      // Group-buy / live sections (only when FEATURES.groupBuying is on).
      case "group_buy_banner":
      case "weekly_group_buys":
      case "closing_group_buys":
      case "weekly_live_streams":
      case "chime_select":
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <div className="desktop-home-band">
              {section.key === "group_buy_banner" ? (
                <HomeGroupBuyBannerSection block={section} />
              ) : section.key === "weekly_group_buys" ? (
                <WeeklyGroupBuysSection block={section} />
              ) : section.key === "closing_group_buys" ? (
                <ClosingGroupBuysSection block={section} />
              ) : section.key === "weekly_live_streams" ? (
                <WeeklyLiveStreamsSection block={section} />
              ) : (
                <ChimeSelectGroupBuySection block={section} />
              )}
            </div>
          </Band>
        );

      case "custom_spacer": {
        const height = str(cfg.height) || "normal";
        const cls =
          height === "tight" ? "h-6 md:h-10" : height === "loose" ? "h-16 md:h-28" : "h-10 md:h-16";
        return (
          <div key={section.id} className={cn(BAND_BG[tone], "w-full")} aria-hidden>
            <DesktopContainer className={CONTENT_MAX}>
              <div className={cn(cls, "flex items-center")}>
                {cfg.divider === true ? <span className="h-px w-full bg-[#E9EDF2]" /> : null}
              </div>
            </DesktopContainer>
          </div>
        );
      }

      case "custom_banner": {
        const img = str(cfg.image_url);
        if (!img) return null;
        const mobileImg = str(cfg.mobile_image_url);
        const href = str(cfg.link_url);
        const pic = (
          <picture>
            {mobileImg ? <source media="(max-width: 767px)" srcSet={mobileImg} /> : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={section.title} className="h-full w-full object-cover" loading="lazy" />
          </picture>
        );
        const caption = str(cfg.caption);
        const buttonText = str(cfg.button_text);
        const heading = isCustomBannerHeading(section.title) ? section.title : "";
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <div
              className={cn(
                "overflow-hidden rounded-[clamp(16px,2vw,24px)] bg-[#EEF8FC]",
                mobileImg ? "aspect-[3/2] md:aspect-[3/1]" : "aspect-[3/1]"
              )}
            >
              {href ? (
                <Link href={href} className="block h-full w-full">
                  {pic}
                </Link>
              ) : (
                pic
              )}
            </div>
            {heading || caption || (buttonText && href) ? (
              <div className="mt-3 space-y-1.5 md:mt-4">
                {heading ? (
                  <h2 className="text-[22px] font-bold leading-[1.25] text-[#153E73] md:text-[28px]">{heading}</h2>
                ) : null}
                {caption ? (
                  <p className="whitespace-pre-line text-sm text-[#687386] md:text-[15px]">{caption}</p>
                ) : null}
                {buttonText && href ? (
                  <Link
                    href={href}
                    className="inline-flex rounded-full bg-[#FFD454] px-4 py-2 text-sm font-bold text-[#153E73]"
                  >
                    {buttonText}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </Band>
        );
      }

      case "custom_text": {
        const body = str(cfg.body);
        const img = str(cfg.image_url);
        const btn = str(cfg.button_text);
        const href = str(cfg.link_url);
        if (!section.title && !body && !img) return null;
        return (
          <Band key={section.id} tone={tone} label={section.title}>
            <div className={cn("overflow-hidden rounded-[clamp(16px,2vw,24px)] bg-white", img ? "grid md:grid-cols-2" : "p-6 md:p-8")}>
              {img ? (
                <div className="aspect-[3/2] bg-[#EEF8FC]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ) : null}
              <div className={cn("flex flex-col justify-center gap-3", img && "p-6 md:p-8")}>
                {section.title ? (
                  <h2 className="text-[22px] font-bold leading-[1.25] text-[#153E73] md:text-[28px]">{section.title}</h2>
                ) : null}
                {section.subtitle ? <p className="text-sm font-semibold text-[#4A5B78]">{section.subtitle}</p> : null}
                {body ? <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#465467]">{body}</p> : null}
                {btn && href ? (
                  <Link href={href} className="mt-1 inline-flex h-11 w-fit items-center rounded-full bg-[#153E73] px-6 text-sm font-bold text-white">
                    {btn}
                  </Link>
                ) : null}
              </div>
            </div>
          </Band>
        );
      }

      default:
        return null;
    }
  };

  // Drop sections with nothing to show first, so the background alternation only counts real bands.
  const visible = (sections ?? [])
    .filter((s) => GROUP_BUY_CONSUMER_VISIBLE || !HIDDEN_HOME_GROUP_BUY_KEYS.has(s.key))
    .filter((s) => renderSection(s, null, "warm") !== null);
  const tones = alternateTones(visible);

  return (
    <div className="desktop-home w-full overflow-x-clip bg-[#FFFEFA]">
      {draftPreview ? (
        <div className="border-b border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900">
          草稿預覽模式 — 尚未發布，訪客看不到此版面
        </div>
      ) : null}
      {sections === null ? (
        <DesktopContainer className={cn(CONTENT_MAX, "space-y-6 py-6")}>
          <div className="aspect-video w-full animate-pulse rounded-3xl bg-[#EEF3F7]" />
          <div className="mx-auto h-14 w-full max-w-[760px] animate-pulse rounded-full bg-[#EEF3F7]" />
          <div className="h-40 w-full animate-pulse rounded-2xl bg-[#EEF3F7]" />
        </DesktopContainer>
      ) : (
        visible.map((section, i) => (
          <SectionSpacing.Provider
            key={section.id}
            value={
              DESKTOP_SPACING_CLASS[
                resolveBlockSpacing(section.config, "desktop", layout.spacing.desktop)
              ]
            }
          >
            {renderSection(
              section,
              i > 0 ? visible[i - 1]!.key : null,
              tones.get(section.id) ?? "warm"
            )}
          </SectionSpacing.Provider>
        ))
      )}

      {/* 首頁彈跳公告：與手機版共用同一份後台設定。 */}
      <HomepagePopupDialog />
    </div>
  );
}
