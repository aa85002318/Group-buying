"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DesktopProductCard } from "@/components/desktop/DesktopProductCard";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import {
  DESKTOP_CAMPAIGN_FALLBACKS,
  DESKTOP_COLORS,
  DESKTOP_HERO_FALLBACK,
  DESKTOP_IP_WAVE_SRC,
  DESKTOP_PROMO_CARD_B,
} from "@/lib/desktop/brand-assets";
import { listOrderedDesktopHomeSections } from "@/lib/home/blocks";
import {
  GROUP_BUY_CONSUMER_VISIBLE,
  HIDDEN_HOME_GROUP_BUY_KEYS,
} from "@/lib/features/group-buy-visibility";
import type { HomepageBlock } from "@/lib/types/database";
import { parseQuickServicesSettings } from "@/types/home-quick-service";
import { HomeGroupBuyBannerSection } from "@/components/home/group-buy-banner/HomeGroupBuyBannerSection";
import { HomeServiceShortcutsSection } from "@/components/home/HomeServiceShortcutsSection";
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
  subtitle?: string | null;
  image_url?: string | null;
  desktop_image_url?: string | null;
  mobile_image_url?: string | null;
  link_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

type Product = {
  id: string;
  name: string;
  price?: number | null;
  sale_price?: number | null;
  image_url?: string | null;
  unit?: string | null;
  spec?: string | null;
  specification?: string | null;
  category?: string | null;
};

type Recipe = {
  id: string;
  title: string;
  slug?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  difficulty?: string | null;
  prep_time?: number | null;
  cook_time?: number | null;
  total_time?: number | null;
};

type Article = {
  id: string;
  title: string;
  slug?: string | null;
  cover_image?: string | null;
  excerpt?: string | null;
};

type StoreRow = {
  id: string;
  name?: string | null;
  address?: string | null;
  cover_image_url?: string | null;
  image_url?: string | null;
};

const DIFFICULTY: Record<string, string> = {
  easy: "初階",
  medium: "進階",
  hard: "挑戰",
};

const CAMPAIGN_TITLES = ["歡慶週年慶", "精選巧克力系列", "烘焙新手包"];

function bannerImage(b: Banner) {
  return b.desktop_image_url || b.image_url || b.mobile_image_url || null;
}

function recipeHref(r: Recipe) {
  return `/recipes/${r.slug || r.id}`;
}

function recipeCover(r: Recipe) {
  return r.cover_image_url || r.cover_image || null;
}

function productPrice(p: Product) {
  return Number(p.sale_price ?? p.price ?? 0);
}

function SectionHeading({
  title,
  href,
  showViewAll = true,
}: {
  title: string;
  href?: string;
  showViewAll?: boolean;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold tracking-wide text-[#153E73]">{title}</h2>
      {showViewAll && href ? (
        <Link href={href} className="text-sm font-semibold text-[#79C7E8] hover:underline">
          查看全部
        </Link>
      ) : null}
    </div>
  );
}

function DesktopHomeSidebar({ store }: { store: StoreRow | null }) {
  const storeCover = store?.cover_image_url || store?.image_url || DESKTOP_PROMO_CARD_B;

  return (
    <aside className="flex flex-col gap-4">
      {/* 1. 會員登入 — 無 IP */}
      <section
        className="rounded-2xl p-5"
        style={{ background: DESKTOP_COLORS.skySoft }}
        aria-label="會員登入"
      >
        <p className="text-sm text-[#687386]">Hi！歡迎來到</p>
        <h2 className="mt-1 text-xl font-bold text-[#153E73]">CHIMEIDIY</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#687386]">
          登入會員，享受更多專屬優惠
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={APP_ROUTES.login}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#153E73] text-sm font-bold text-white"
          >
            立即登入
          </Link>
          <Link
            href={APP_ROUTES.register}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#153E73] bg-white text-sm font-bold text-[#153E73]"
          >
            註冊新會員
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-[#153E73]">
          {[
            [APP_ROUTES.memberBenefits, "會員專屬優惠"],
            [APP_ROUTES.memberOrders, "我的訂單"],
            [APP_ROUTES.stores, "門市取貨"],
            [APP_ROUTES.memberCarrier, "發票載具管理"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="block rounded-lg bg-white/80 px-2 py-2 text-center hover:bg-white">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 2. 門市資訊 — 無 IP */}
      <section
        className="overflow-hidden rounded-2xl"
        style={{ background: DESKTOP_COLORS.skySoft }}
        aria-label="門市資訊"
      >
        <div className="relative aspect-[16/10] bg-[#E9EDF2]">
          <Image
            src={storeCover}
            alt={store?.name || "門市"}
            fill
            className="object-cover"
            sizes="320px"
          />
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-base font-bold text-[#153E73]">
            {store?.name || "大安門市"}
          </h3>
          {store?.address ? (
            <p className="text-sm leading-relaxed text-[#687386]">{store.address}</p>
          ) : (
            <p className="text-sm text-[#687386]">鄰近捷運，歡迎到店選購與取貨</p>
          )}
          <Link
            href={APP_ROUTES.stores}
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-bold text-white"
            style={{ background: DESKTOP_COLORS.sky }}
          >
            查看門市資訊
          </Link>
        </div>
      </section>

      {/* 3. 加入會員 — 全頁唯一大型 IP */}
      <section
        className="relative overflow-hidden rounded-2xl p-5"
        style={{ background: DESKTOP_COLORS.cream }}
        aria-label="加入會員"
      >
        <div className="relative z-10 max-w-[58%] space-y-3 pb-2">
          <h3 className="text-xl font-bold leading-snug text-[#153E73]">
            加入會員
            <br />
            享更多烘焙好康！
          </h3>
          <ul className="space-y-1 text-sm text-[#687386]">
            <li>會員禮遇</li>
            <li>生日禮</li>
            <li>最新活動通知</li>
          </ul>
          <Link
            href={APP_ROUTES.register}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#153E73] px-5 text-sm font-bold text-white"
          >
            立即註冊
          </Link>
        </div>
        <div
          className="pointer-events-none absolute bottom-0 right-0 z-0 flex h-[45%] max-h-[140px] w-[48%] items-end justify-end"
          aria-hidden
        >
          <Image
            src={DESKTOP_IP_WAVE_SRC}
            alt=""
            width={220}
            height={142}
            className="h-full w-auto max-h-[140px] object-contain object-bottom"
          />
        </div>
      </section>
    </aside>
  );
}

/** Grid template for "cards per row" on the website (Tailwind-safe list). */
const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-2 xl:grid-cols-4",
  5: "grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  6: "grid-cols-3 xl:grid-cols-6",
  7: "grid-cols-4 xl:grid-cols-7",
  8: "grid-cols-4 xl:grid-cols-8",
};

function gridCols(columns: number | null, fallback: number) {
  return GRID_COLS[columns ?? fallback] ?? GRID_COLS[fallback];
}

/** Avoid a lone orphan row: trim to full rows once there is at least one. */
function fillRows(count: number, perRow: number) {
  if (count <= perRow) return count;
  return Math.floor(count / perRow) * perRow;
}

type DesktopSection = ReturnType<typeof listOrderedDesktopHomeSections>[number];

/**
 * Website home (Desktop V2).
 *
 * CMS step 3: renders the SAME homepage_blocks list as the app, in the same
 * order — editors change a section once. Each block can be hidden on the
 * website or given a different "cards per row" via block.config
 * (desktop_visible / desktop_columns), see listOrderedDesktopHomeSections.
 */
export function DesktopHome() {
  const router = useRouter();
  const [sections, setSections] = useState<DesktopSection[] | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [store, setStore] = useState<StoreRow | null>(null);
  const [query, setQuery] = useState("");
  const [productCategory, setProductCategory] = useState<string>("all");
  const [draftPreview, setDraftPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Admin Page Builder loads the storefront with ?preview=draft.
    const previewDraft =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview") === "draft";
    setDraftPreview(previewDraft);
    const safe = (p: Promise<Response>) => p.then((r) => r.json()).catch(() => ({}));
    Promise.all([
      safe(fetch(previewDraft ? "/api/cms?preview=draft" : "/api/cms", { credentials: "include" })),
      safe(fetch("/api/products")),
      safe(fetch("/api/recipes")),
      safe(fetch("/api/articles")),
      safe(fetch("/api/stores?channel=website")),
    ]).then(([cms, prod, rec, art, stores]) => {
      if (cancelled) return;
      setSections(listOrderedDesktopHomeSections((cms.blocks as HomepageBlock[]) ?? []));
      setBanners((cms.banners as Banner[]) ?? []);
      setProducts((prod.products as Product[]) ?? []);
      setRecipes((rec.recipes as Recipe[]) ?? []);
      setArticles((art.articles as Article[]) ?? []);
      const list = (stores.stores as StoreRow[]) ?? [];
      setStore(list.find((s) => (s.name || "").includes("大安")) ?? list[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBanners = useMemo(() => {
    const preferred = banners
      .filter(
        (b) =>
          b.is_active !== false &&
          bannerImage(b) &&
          (String((b as Banner & { placement?: string }).placement ?? "") ===
            "desktop_home_hero" ||
            String((b as Banner & { banner_type?: string }).banner_type ?? "") ===
              "desktop_home_hero")
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    if (preferred.length) return preferred;
    return banners
      .filter((b) => b.is_active !== false && bannerImage(b))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [banners]);

  const [heroIndex, setHeroIndex] = useState(0);
  const heroBanner = activeBanners[heroIndex] ?? activeBanners[0] ?? null;
  const heroSrc = (heroBanner && bannerImage(heroBanner)) || DESKTOP_HERO_FALLBACK;

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const t = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % activeBanners.length);
    }, 6000);
    return () => window.clearInterval(t);
  }, [activeBanners.length]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).slice(0, 6);
  }, [products]);

  const campaignCards = useCallback(
    (limit: number) => {
      const fromArticles = articles.slice(0, limit).map((a, i) => ({
        id: a.id,
        title: a.title || CAMPAIGN_TITLES[i % CAMPAIGN_TITLES.length],
        href: a.slug ? `/articles/${a.slug}` : `/articles/${a.id}`,
        image: a.cover_image || DESKTOP_CAMPAIGN_FALLBACKS[i % DESKTOP_CAMPAIGN_FALLBACKS.length],
      }));
      if (fromArticles.length >= limit) return fromArticles;
      const fromBanners = activeBanners.slice(1, 1 + limit).map((b, i) => ({
        id: b.id,
        title: b.title || CAMPAIGN_TITLES[i % CAMPAIGN_TITLES.length],
        href: b.link_url || APP_ROUTES.promotions,
        image: bannerImage(b) || DESKTOP_CAMPAIGN_FALLBACKS[i % DESKTOP_CAMPAIGN_FALLBACKS.length],
      }));
      return [...fromArticles, ...fromBanners].slice(0, limit);
    },
    [articles, activeBanners]
  );

  const filteredProducts = useMemo(() => {
    if (productCategory === "all") return products;
    return products.filter((p) => p.category === productCategory);
  }, [products, productCategory]);

  const pickRecipes = (section: DesktopSection) => {
    const limit = section.displayCount || 8;
    if (section.sourceMode === "manual" && section.manualIds.length) {
      const byId = new Map(recipes.map((r) => [r.id, r]));
      const picked = section.manualIds
        .map((id) => byId.get(id))
        .filter((r): r is Recipe => Boolean(r));
      if (picked.length) return picked.slice(0, limit);
    }
    return recipes.slice(0, limit);
  };

  const renderSection = (section: DesktopSection): ReactNode => {
    // Same feature gate as the app home: group-buy sections stay hidden
    // while FEATURES.groupBuying is off.
    if (!GROUP_BUY_CONSUMER_VISIBLE && HIDDEN_HOME_GROUP_BUY_KEYS.has(section.key)) return null;
    const cols = section.desktop.columns;
    switch (section.key) {
      case "hero":
        return (
          <section key={section.id} aria-label={section.title || "主視覺 Banner"} className="space-y-4">
            <div>
              <Link
                href={heroBanner?.link_url || APP_ROUTES.shop}
                className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-[#EEF8FC]"
              >
                <Image
                  src={heroSrc}
                  alt=""
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(min-width:1440px) 1100px, 90vw"
                />
              </Link>
              {activeBanners.length > 1 ? (
                <div className="mt-3 flex justify-center gap-2">
                  {activeBanners.map((b, i) => (
                    <button
                      key={b.id}
                      type="button"
                      aria-label={`Banner ${i + 1}`}
                      onClick={() => setHeroIndex(i)}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        i === heroIndex ? "bg-[#153E73]" : "bg-[#E9EDF2]"
                      )}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <form
              className="flex overflow-hidden rounded-full border border-[#E9EDF2] bg-white shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                router.push(
                  q ? `${APP_ROUTES.shopSearch}?q=${encodeURIComponent(q)}` : APP_ROUTES.shop
                );
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜尋商品、食譜、品牌…"
                className="min-w-0 flex-1 bg-transparent px-5 py-3.5 text-[15px] text-[#153E73] outline-none placeholder:text-[#687386]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#153E73] px-6 text-sm font-semibold text-white"
              >
                <Search className="h-4 w-4" />
                搜尋
              </button>
            </form>
          </section>
        );

      case "quick_entry": {
        const qs = parseQuickServicesSettings(section.config);
        const items = qs.items.filter((i) => i.enabled !== false).sort((a, b) => a.sortOrder - b.sortOrder);
        if (!items.length) return null;
        return (
          <section key={section.id}>
            <SectionHeading
              title={section.title || qs.title || "常用服務"}
              href={qs.allServicesHref}
              showViewAll={Boolean(qs.allServicesHref)}
            />
            <ul className={cn("grid gap-3", gridCols(cols, Math.min(8, Math.max(4, items.length))))}>
              {items.slice(0, 16).map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href || "#"}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center transition hover:shadow-sm"
                  >
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
          </section>
        );
      }

      case "latest_campaigns": {
        const perRow = cols ?? 3;
        const available = campaignCards(Math.max(1, section.displayCount || 3));
        const cards = available.slice(0, fillRows(available.length, perRow));
        if (!cards.length) return null;
        return (
          <section key={section.id}>
            <SectionHeading
              title={section.title || "最新活動"}
              href={section.viewAllUrl || APP_ROUTES.promotions}
            />
            <div className={cn("grid gap-4", gridCols(cols, 3))}>
              {cards.map((card) => (
                <Link key={card.id} href={card.href} className="group overflow-hidden rounded-2xl bg-white">
                  <div className="relative aspect-[16/10] bg-[#EEF8FC]">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      sizes="(min-width:1280px) 22vw, 40vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-base font-bold text-[#153E73]">{card.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      }

      case "latest_recipes": {
        const picked = pickRecipes(section);
        const list = picked.slice(0, fillRows(picked.length, cols ?? 4));
        return (
          <section key={section.id}>
            <SectionHeading title={section.title || "精選食譜"} href={section.viewAllUrl || APP_ROUTES.recipes} />
            <div className={cn("grid gap-4", gridCols(cols, 4))}>
              {list.map((r) => {
                const cover = recipeCover(r);
                const mins = r.total_time ?? r.prep_time ?? r.cook_time;
                return (
                  <article key={r.id} className="overflow-hidden rounded-2xl bg-white">
                    <Link href={recipeHref(r)} className="relative block aspect-[4/3] bg-[#EEF8FC]">
                      {cover ? (
                        <Image src={cover} alt={r.title} fill className="object-cover" sizes="(min-width:1280px) 18vw, 40vw" />
                      ) : null}
                      <span className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
                        <FavoriteButton targetType="recipe" targetId={r.id} size="sm" />
                      </span>
                    </Link>
                    <div className="space-y-1 p-3">
                      <Link href={recipeHref(r)} className="line-clamp-2 text-sm font-bold text-[#153E73]">
                        {r.title}
                      </Link>
                      <p className="text-xs text-[#687386]">
                        {mins != null ? `${mins} 分` : null}
                        {mins != null && r.difficulty ? " · " : null}
                        {r.difficulty ? DIFFICULTY[r.difficulty] ?? r.difficulty : null}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      }

      case "ingredient_shop":
        return (
          <section key={section.id}>
            <SectionHeading title={section.title || "一鍵買齊材料"} href={section.viewAllUrl || APP_ROUTES.shop} />
            {categories.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {["all", ...categories].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setProductCategory(c)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-semibold",
                      productCategory === c ? "bg-[#FFF5CC] text-[#153E73]" : "bg-white text-[#687386]"
                    )}
                  >
                    {c === "all" ? "全部" : c}
                  </button>
                ))}
              </div>
            ) : null}
            <div className={cn("grid gap-4", gridCols(cols, 5))}>
              {filteredProducts.slice(0, section.displayCount || 10).map((p) => (
                <DesktopProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={productPrice(p)}
                  image_url={p.image_url}
                  spec={p.spec || p.specification || p.unit}
                  href={productPath(p.id)}
                />
              ))}
            </div>
          </section>
        );

      // Group-buy / live / shortcut sections: the app components are already
      // responsive (md/xl card sizes); the .desktop-home-band wrapper strips
      // their full-bleed band padding so they align with the column.
      case "group_buy_banner":
        return (
          <div key={section.id} className="desktop-home-band">
            <HomeGroupBuyBannerSection block={section} />
          </div>
        );
      case "weekly_group_buys":
        return (
          <div key={section.id} className="desktop-home-band">
            <WeeklyGroupBuysSection block={section} />
          </div>
        );
      case "closing_group_buys":
        return (
          <div key={section.id} className="desktop-home-band">
            <ClosingGroupBuysSection block={section} />
          </div>
        );
      case "weekly_live_streams":
        return (
          <div key={section.id} className="desktop-home-band">
            <WeeklyLiveStreamsSection block={section} />
          </div>
        );
      case "chime_select":
        return (
          <div key={section.id} className="desktop-home-band">
            <ChimeSelectGroupBuySection block={section} />
          </div>
        );
      case "service_shortcuts":
        return (
          <div key={section.id} className="desktop-home-band">
            <HomeServiceShortcutsSection block={section} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="desktop-home w-full" style={{ background: DESKTOP_COLORS.warmWhite }}>
      {draftPreview ? (
        <div className="border-b border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900">
          草稿預覽模式 — 尚未發布，訪客看不到此版面
        </div>
      ) : null}
      <DesktopContainer className="py-6 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            {sections === null ? (
              <div className="space-y-6" aria-hidden>
                <div className="aspect-video w-full animate-pulse rounded-2xl bg-[#EEF3F7]" />
                <div className="h-14 w-full animate-pulse rounded-full bg-[#EEF3F7]" />
                <div className="h-48 w-full animate-pulse rounded-2xl bg-[#EEF3F7]" />
              </div>
            ) : (
              sections.map((section) => renderSection(section))
            )}
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-[96px]">
              <DesktopHomeSidebar store={store} />
            </div>
          </div>
        </div>

        {/* Sidebar under main on 1024–1279 */}
        <div className="mt-8 max-w-md xl:hidden">
          <DesktopHomeSidebar store={store} />
        </div>
      </DesktopContainer>
    </div>
  );
}
