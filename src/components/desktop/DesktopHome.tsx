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
  cta_text?: string | null;
  focus_position?: string | null;
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

const QUICK_SERVICES: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: APP_ROUTES.shop, label: "烘焙材料", icon: Package },
  { href: APP_ROUTES.recipes, label: "食譜影音", icon: BookOpen },
  { href: APP_ROUTES.ai, label: "AI助手", icon: Sparkles },
  { href: APP_ROUTES.promotions, label: "優惠活動", icon: Tag },
  { href: APP_ROUTES.stores, label: "門市資訊", icon: MapPin },
  { href: APP_ROUTES.memberBenefits, label: "會員禮遇", icon: Gift },
  { href: APP_ROUTES.articles, label: "食材知識", icon: BookOpen },
  { href: "/help/order-guide", label: "新手入門", icon: Store },
];

const DIFFICULTY: Record<string, string> = {
  easy: "初階",
  medium: "進階",
  hard: "挑戰",
};

function asSettings(raw: unknown): PageLayoutSettingsJson {
  return raw && typeof raw === "object" ? (raw as PageLayoutSettingsJson) : {};
}

function bannerImage(b: Banner) {
  return b.desktop_image_url || b.image_url || b.mobile_image_url || null;
}

function recipeHref(r: Recipe) {
  return r.slug ? `/recipes/${r.slug}` : `/recipes/${r.id}`;
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
  showViewAll,
}: {
  title: string;
  href?: string;
  showViewAll?: boolean;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold tracking-wide text-[#153E73]">{title}</h2>
      {showViewAll && href ? (
        <Link href={href} className="text-sm font-semibold text-[#B56A45] hover:underline">
          查看全部
        </Link>
      ) : null}
    </div>
  );
}

export function DesktopHome() {
  const router = useRouter();
  const [settings, setSettings] = useState<PageLayoutSetting[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/layout-settings?page_key=home&platform=desktop").then((r) => r.json()),
      fetch("/api/cms").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/recipes").then((r) => r.json()),
      fetch("/api/articles").then((r) => r.json()),
    ])
      .then(([layout, cms, prod, rec, art]) => {
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

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const t = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % activeBanners.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [activeBanners.length]);

  const renderSection = (section: PageLayoutSetting) => {
    const cfg = asSettings(section.settings_json);
    const title = String(cfg.title ?? section.section_key);
    const cols = section.columns ?? 4;
    const limit = section.display_limit ?? 8;

    switch (section.section_key) {
      case "hero": {
        const hero = activeBanners[heroIndex] ?? activeBanners[0];
        const maxH = Number(cfg.heroMaxHeight ?? 600);
        return (
          <section key={section.id} className="w-full">
            <div
              className="relative w-full overflow-hidden bg-[#F7F2EA]"
              style={{ aspectRatio: "5 / 2", maxHeight: maxH }}
            >
              {hero && bannerImage(hero) ? (
                <Link href={hero.link_url || APP_ROUTES.shop} className="block h-full w-full">
                  <Image
                    src={bannerImage(hero)!}
                    alt={hero.title || "Hero"}
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                  />
                  {(hero.title || hero.subtitle || hero.cta_text) && (
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 to-transparent">
                      <DesktopContainer className="pb-10 text-white">
                        {hero.title ? (
                          <h1 className="text-3xl font-bold drop-shadow">{hero.title}</h1>
                        ) : null}
                        {hero.subtitle ? (
                          <p className="mt-2 max-w-xl text-base opacity-95">{hero.subtitle}</p>
                        ) : null}
                        {hero.cta_text ? (
                          <span className="mt-4 inline-flex rounded-full bg-[#FEE169] px-5 py-2 text-sm font-bold text-[#153E73]">
                            {hero.cta_text}
                          </span>
                        ) : null}
                      </DesktopContainer>
                    </div>
                  )}
                </Link>
              ) : (
                <DesktopContainer className="flex h-full items-center">
                  <div>
                    <p className="text-3xl font-bold text-[#153E73]">CHIMEIDIY</p>
                    <p className="mt-2 text-[#7A5C4E]">烘焙生活，從這裡開始</p>
                  </div>
                </DesktopContainer>
              )}
            </div>
          </section>
        );
      }
      case "search":
        return (
          <section key={section.id} className="py-8">
            <DesktopContainer>
              <form
                className="mx-auto flex max-w-3xl overflow-hidden rounded-full border border-[#E5D9C8] bg-white shadow-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = query.trim();
                  router.push(q ? `${APP_ROUTES.shopSearch}?q=${encodeURIComponent(q)}` : APP_ROUTES.shop);
                }}
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜尋商品、食譜、品牌…"
                  className="min-w-0 flex-1 bg-transparent px-5 py-3.5 text-[15px] outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#153E73] px-6 text-sm font-semibold text-white"
                >
                  <Search className="h-4 w-4" />
                  搜尋
                </button>
              </form>
            </DesktopContainer>
          </section>
        );
      case "quick_services":
        return (
          <section key={section.id} className="py-6">
            <DesktopContainer>
              {cfg.showTitle !== false ? <SectionHeading title={title} /> : null}
              <ul className="grid grid-cols-4 gap-4 xl:grid-cols-8">
                {QUICK_SERVICES.slice(0, limit || 8).map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 text-center transition hover:bg-[#FFF8F0]"
                      >
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3C4] text-[#153E73]">
                          <Icon className="h-5 w-5" strokeWidth={1.9} />
                        </span>
                        <span className="text-sm font-semibold text-[#5E4035]">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </DesktopContainer>
          </section>
        );
      case "latest_campaigns": {
        const list = articles.slice(0, limit);
        return (
          <section key={section.id} className="py-8">
            <DesktopContainer>
              <SectionHeading
                title={title}
                href={String(cfg.viewAllUrl ?? APP_ROUTES.promotions)}
                showViewAll={cfg.showViewAll !== false}
              />
              <div
                className={cn(
                  "grid gap-5",
                  "grid-cols-2 xl:grid-cols-3"
                )}
              >
                {list.map((a) => (
                  <Link
                    key={a.id}
                    href={a.slug ? `/articles/${a.slug}` : `/articles/${a.id}`}
                    className="group overflow-hidden rounded-2xl bg-white"
                  >
                    <div className="relative aspect-[16/10] bg-[#F7F2EA]">
                      {a.cover_image ? (
                        <Image
                          src={a.cover_image}
                          alt={a.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          sizes="(min-width:1280px) 30vw, 45vw"
                        />
                      ) : null}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-base font-bold text-[#153E73]">{a.title}</h3>
                      {a.excerpt ? (
                        <p className="mt-1 line-clamp-2 text-sm text-[#7A5C4E]">{a.excerpt}</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </DesktopContainer>
          </section>
        );
      }
      case "featured_recipes": {
        const list = recipes.slice(0, limit);
        return (
          <section key={section.id} className="py-8">
            <DesktopContainer>
              <SectionHeading
                title={title}
                href={String(cfg.viewAllUrl ?? APP_ROUTES.recipes)}
                showViewAll={cfg.showViewAll !== false}
              />
              <div className="grid grid-cols-3 gap-5 xl:grid-cols-4 2xl:grid-cols-5">
                {list.map((r) => {
                  const cover = recipeCover(r);
                  const mins = r.total_time ?? r.prep_time ?? r.cook_time;
                  return (
                    <article key={r.id} className="overflow-hidden rounded-2xl bg-white">
                      <Link href={recipeHref(r)} className="relative block aspect-[4/3] bg-[#F7F2EA]">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={r.title}
                            fill
                            className="object-cover"
                            sizes="(min-width:1440px) 18vw, 22vw"
                          />
                        ) : null}
                        {cfg.showFavorite !== false ? (
                          <span
                            className="absolute right-2 top-2"
                            onClick={(e) => e.preventDefault()}
                          >
                            <FavoriteButton targetType="recipe" targetId={r.id} size="sm" />
                          </span>
                        ) : null}
                      </Link>
                      <div className="space-y-1 p-3">
                        <Link href={recipeHref(r)} className="line-clamp-2 text-sm font-bold text-[#153E73]">
                          {r.title}
                        </Link>
                        <p className="text-xs text-[#9A7B6C]">
                          {cfg.showPrepTime !== false && mins != null ? `${mins} 分` : null}
                          {cfg.showPrepTime !== false &&
                          mins != null &&
                          cfg.showDifficulty !== false &&
                          r.difficulty
                            ? " · "
                            : null}
                          {cfg.showDifficulty !== false && r.difficulty
                            ? DIFFICULTY[r.difficulty] ?? r.difficulty
                            : null}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </DesktopContainer>
          </section>
        );
      }
      case "ingredient_shop":
      case "popular_products": {
        const list = products.slice(0, limit);
        return (
          <section key={section.id} className="py-8">
            <DesktopContainer>
              <SectionHeading
                title={title}
                href={String(cfg.viewAllUrl ?? APP_ROUTES.shop)}
                showViewAll={cfg.showViewAll !== false}
              />
              <div
                className={cn(
                  "grid gap-4",
                  cols >= 5
                    ? "grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    : "grid-cols-3 xl:grid-cols-4"
                )}
              >
                {list.map((p) => (
                  <DesktopProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={productPrice(p)}
                    image_url={p.image_url}
                    spec={p.spec || p.specification || p.unit}
                    href={productPath(p.id)}
                    showSpec={cfg.showSpec !== false}
                    showFavorite={cfg.showFavorite !== false}
                    showAddToCart={cfg.showAddToCart !== false}
                  />
                ))}
              </div>
            </DesktopContainer>
          </section>
        );
      }
      case "shop_features":
        return (
          <section key={section.id} className="py-10">
            <DesktopContainer>
              <SectionHeading title={title} />
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  { t: "嚴選材料", d: "門市同款烘焙原料，品質有保障" },
                  { t: "食譜連動", d: "看完食譜一鍵買齊所需材料" },
                  { t: "會員禮遇", d: "門市與線上會員福利同步" },
                  { t: "門市取貨", d: "下單後可至鄰近門市取貨" },
                ].map((f) => (
                  <div key={f.t} className="rounded-2xl bg-white px-5 py-6">
                    <p className="text-lg font-bold text-[#153E73]">{f.t}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#7A5C4E]">{f.d}</p>
                  </div>
                ))}
              </div>
            </DesktopContainer>
          </section>
        );
      default:
        return null;
    }
  };

  return <div className="desktop-home w-full bg-[var(--cream,#FFFDF9)]">{ordered.map(renderSection)}</div>;
}
