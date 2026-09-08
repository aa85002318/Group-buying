"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Gift,
  MapPin,
  Package,
  Search,
  Sparkles,
  Store,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DesktopProductCard } from "@/components/desktop/DesktopProductCard";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import {
  DESKTOP_CAMPAIGN_FALLBACKS,
  DESKTOP_COLORS,
  DESKTOP_HERO_FALLBACK,
  DESKTOP_IP_WAVE_SRC,
  DESKTOP_PROMO_CARD_A,
  DESKTOP_PROMO_CARD_B,
} from "@/lib/desktop/brand-assets";
import {
  DESKTOP_HOME_SECTION_DEFAULTS,
  type PageLayoutSetting,
  type PageLayoutSettingsJson,
} from "@/lib/layout/page-layout-settings";
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

const QUICK_SERVICES: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  bg: string;
  color: string;
}> = [
  { href: APP_ROUTES.shop, label: "烘焙材料", icon: Package, bg: "#FFF5CC", color: "#153E73" },
  { href: APP_ROUTES.recipes, label: "食譜影音", icon: BookOpen, bg: "#EEF8FC", color: "#79C7E8" },
  { href: APP_ROUTES.ai, label: "AI助手", icon: Sparkles, bg: "#FFFFFF", color: "#F16458" },
  { href: APP_ROUTES.promotions, label: "優惠活動", icon: Tag, bg: "#FFF5CC", color: "#F16458" },
  { href: APP_ROUTES.stores, label: "門市資訊", icon: MapPin, bg: "#EEF8FC", color: "#153E73" },
  { href: APP_ROUTES.memberBenefits, label: "會員禮遇", icon: Gift, bg: "#FFFFFF", color: "#FFD454" },
  { href: APP_ROUTES.articles, label: "食材知識", icon: BookOpen, bg: "#EEF8FC", color: "#79C7E8" },
  { href: "/help/order-guide", label: "新手入門", icon: Store, bg: "#FFF5CC", color: "#153E73" },
];

const DIFFICULTY: Record<string, string> = {
  easy: "初階",
  medium: "進階",
  hard: "挑戰",
};

const CAMPAIGN_TITLES = ["歡慶週年慶", "精選巧克力系列", "烘焙新手包"];

function asSettings(raw: unknown): PageLayoutSettingsJson {
  return raw && typeof raw === "object" ? (raw as PageLayoutSettingsJson) : {};
}

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

export function DesktopHome() {
  const router = useRouter();
  const [settings, setSettings] = useState<PageLayoutSetting[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [store, setStore] = useState<StoreRow | null>(null);
  const [query, setQuery] = useState("");
  const [productCategory, setProductCategory] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/layout-settings?page_key=home&platform=desktop").then((r) => r.json()),
      fetch("/api/cms").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/recipes").then((r) => r.json()),
      fetch("/api/articles").then((r) => r.json()),
      fetch("/api/stores?channel=website").then((r) => r.json()),
    ])
      .then(([layout, cms, prod, rec, art, stores]) => {
        if (cancelled) return;
        const rows = (layout.settings as PageLayoutSetting[]) ?? [];
        setSettings(
          rows.length
            ? rows
            : DESKTOP_HOME_SECTION_DEFAULTS.map((s, i) => ({
                id: `fallback-${i}`,
                page_key: "home",
                platform: "desktop",
                enabled: true,
                ...s,
              }))
        );
        setBanners((cms.banners as Banner[]) ?? []);
        setProducts((prod.products as Product[]) ?? []);
        setRecipes((rec.recipes as Recipe[]) ?? []);
        setArticles((art.articles as Article[]) ?? []);
        const list = (stores.stores as StoreRow[]) ?? [];
        setStore(
          list.find((s) => (s.name || "").includes("大安")) ?? list[0] ?? null
        );
      })
      .catch(() => {
        if (!cancelled) {
          setSettings(
            DESKTOP_HOME_SECTION_DEFAULTS.map((s, i) => ({
              id: `fallback-${i}`,
              page_key: "home",
              platform: "desktop",
              enabled: true,
              ...s,
            }))
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ordered = useMemo(
    () =>
      [...settings]
        .filter((s) => s.enabled)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [settings]
  );

  const activeBanners = useMemo(
    () =>
      banners
        .filter((b) => b.is_active !== false && bannerImage(b))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [banners]
  );

  const heroBanner = activeBanners[0];
  const heroSrc = (heroBanner && bannerImage(heroBanner)) || DESKTOP_HERO_FALLBACK;

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).slice(0, 6);
  }, [products]);

  const campaignCards = useMemo(() => {
    const fromArticles = articles.slice(0, 3).map((a, i) => ({
      id: a.id,
      title: a.title || CAMPAIGN_TITLES[i],
      href: a.slug ? `/articles/${a.slug}` : `/articles/${a.id}`,
      image: a.cover_image || DESKTOP_CAMPAIGN_FALLBACKS[i],
    }));
    if (fromArticles.length >= 3) return fromArticles;
    const fromBanners = activeBanners.slice(1, 4).map((b, i) => ({
      id: b.id,
      title: b.title || CAMPAIGN_TITLES[i],
      href: b.link_url || APP_ROUTES.promotions,
      image: bannerImage(b) || DESKTOP_CAMPAIGN_FALLBACKS[i],
    }));
    const merged = [...fromArticles, ...fromBanners].slice(0, 3);
    while (merged.length < 3) {
      const i = merged.length;
      merged.push({
        id: `fallback-campaign-${i}`,
        title: CAMPAIGN_TITLES[i],
        href: APP_ROUTES.promotions,
        image: DESKTOP_CAMPAIGN_FALLBACKS[i],
      });
    }
    return merged;
  }, [articles, activeBanners]);

  const filteredProducts = useMemo(() => {
    if (productCategory === "all") return products;
    return products.filter((p) => p.category === productCategory);
  }, [products, productCategory]);

  const enabled = (key: string) =>
    ordered.find((s) => s.section_key === key) ??
    ({
      id: key,
      page_key: "home",
      platform: "desktop",
      section_key: key,
      enabled: true,
      sort_order: 0,
      layout_type: null,
      columns: null,
      display_limit: null,
      settings_json: {},
    } satisfies PageLayoutSetting);

  const searchSection = enabled("search");
  const quickSection = enabled("quick_services");
  const campaignSection = enabled("latest_campaigns");
  const recipeSection = enabled("featured_recipes");
  const shopSection = enabled("ingredient_shop");
  const popularSection = enabled("popular_products");

  return (
    <div className="desktop-home w-full" style={{ background: DESKTOP_COLORS.warmWhite }}>
      <DesktopContainer className="py-6 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            {/* Hero — 無 IP */}
            <section aria-label="主視覺">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Link
                  href={heroBanner?.link_url || APP_ROUTES.shop}
                  className="relative min-h-[280px] overflow-hidden rounded-3xl bg-[#EEF8FC] lg:min-h-[340px]"
                >
                  <Image
                    src={heroSrc}
                    alt={heroBanner?.title || "用烘焙創造生活的幸福時光"}
                    fill
                    priority
                    className="object-cover"
                    sizes="(min-width:1280px) 55vw, 90vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/55 to-transparent" />
                  <div className="relative z-10 flex h-full max-w-md flex-col justify-center p-8 text-[#153E73]">
                    <h1 className="text-3xl font-bold leading-tight xl:text-4xl">
                      用烘焙，
                      <br />
                      創造生活的幸福時光
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-[#687386] xl:text-base">
                      嚴選食材・豐富食譜・一站式購齊
                    </p>
                    <span
                      className="mt-5 inline-flex w-fit rounded-full px-5 py-2.5 text-sm font-bold text-white"
                      style={{ background: DESKTOP_COLORS.coral }}
                    >
                      探索更多美味
                    </span>
                  </div>
                </Link>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <Link
                    href={APP_ROUTES.shop}
                    className="relative min-h-[160px] overflow-hidden rounded-2xl bg-white"
                  >
                    <Image
                      src={DESKTOP_PROMO_CARD_A}
                      alt="精選進口食材"
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#153E73]/75 to-transparent" />
                    <div className="absolute bottom-0 p-4 text-white">
                      <p className="text-base font-bold">精選進口食材</p>
                      <p className="text-sm opacity-90">專業烘焙首選</p>
                    </div>
                  </Link>
                  <Link
                    href={`${APP_ROUTES.shop}?tag=beginner`}
                    className="relative min-h-[160px] overflow-hidden rounded-2xl bg-white"
                  >
                    <Image
                      src={DESKTOP_PROMO_CARD_B}
                      alt="新手烘焙專區"
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#153E73]/75 to-transparent" />
                    <div className="absolute bottom-0 p-4 text-white">
                      <p className="text-base font-bold">新手烘焙專區</p>
                      <p className="text-sm opacity-90">從這裡開始</p>
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* 搜尋 */}
            {searchSection.enabled !== false ? (
              <section>
                <form
                  className="flex overflow-hidden rounded-full border border-[#E9EDF2] bg-white shadow-sm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = query.trim();
                    router.push(
                      q
                        ? `${APP_ROUTES.shopSearch}?q=${encodeURIComponent(q)}`
                        : APP_ROUTES.shop
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
            ) : null}

            {/* 常用服務 — icon only */}
            {quickSection.enabled !== false ? (
              <section>
                <SectionHeading title={String(asSettings(quickSection.settings_json).title ?? "常用服務")} showViewAll={false} />
                <ul className="grid grid-cols-4 gap-3 xl:grid-cols-8">
                  {QUICK_SERVICES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center transition hover:shadow-sm"
                        >
                          <span
                            className="inline-flex h-12 w-12 items-center justify-center rounded-full"
                            style={{ background: item.bg, color: item.color }}
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.9} />
                          </span>
                          <span className="text-sm font-semibold text-[#153E73]">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {/* 最新活動 — 無 IP */}
            {campaignSection.enabled !== false ? (
              <section>
                <SectionHeading
                  title={String(asSettings(campaignSection.settings_json).title ?? "最新活動")}
                  href={APP_ROUTES.promotions}
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {campaignCards.map((card) => (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="group overflow-hidden rounded-2xl bg-white"
                    >
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
                        <h3 className="line-clamp-2 text-base font-bold text-[#153E73]">
                          {card.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 精選食譜 — 食物照 only */}
            {recipeSection.enabled !== false ? (
              <section>
                <SectionHeading
                  title={String(asSettings(recipeSection.settings_json).title ?? "精選食譜")}
                  href={APP_ROUTES.recipes}
                />
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  {recipes.slice(0, recipeSection.display_limit ?? 8).map((r) => {
                    const cover = recipeCover(r);
                    const mins = r.total_time ?? r.prep_time ?? r.cook_time;
                    return (
                      <article key={r.id} className="overflow-hidden rounded-2xl bg-white">
                        <Link
                          href={recipeHref(r)}
                          className="relative block aspect-[4/3] bg-[#EEF8FC]"
                        >
                          {cover ? (
                            <Image
                              src={cover}
                              alt={r.title}
                              fill
                              className="object-cover"
                              sizes="(min-width:1280px) 18vw, 40vw"
                            />
                          ) : null}
                          <span
                            className="absolute right-2 top-2"
                            onClick={(e) => e.preventDefault()}
                          >
                            <FavoriteButton targetType="recipe" targetId={r.id} size="sm" />
                          </span>
                        </Link>
                        <div className="space-y-1 p-3">
                          <Link
                            href={recipeHref(r)}
                            className="line-clamp-2 text-sm font-bold text-[#153E73]"
                          >
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
            ) : null}

            {/* 一鍵買齊 / 熱門商品 — 商品照 only */}
            {(shopSection.enabled !== false || popularSection.enabled !== false) && (
              <section>
                <SectionHeading
                  title={String(
                    asSettings(shopSection.settings_json).title ??
                      asSettings(popularSection.settings_json).title ??
                      "一鍵買齊材料"
                  )}
                  href={APP_ROUTES.shop}
                />
                {categories.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setProductCategory("all")}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-semibold",
                        productCategory === "all"
                          ? "bg-[#FFF5CC] text-[#153E73]"
                          : "bg-white text-[#687386]"
                      )}
                    >
                      全部
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setProductCategory(c)}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-sm font-semibold",
                          productCategory === c
                            ? "bg-[#FFF5CC] text-[#153E73]"
                            : "bg-white text-[#687386]"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="grid grid-cols-3 gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                  {filteredProducts
                    .slice(0, shopSection.display_limit ?? popularSection.display_limit ?? 10)
                    .map((p) => (
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
