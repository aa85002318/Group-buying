"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Clock3,
  Search,
  SquarePen,
  X,
} from "lucide-react";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { APP_ROUTES } from "@/lib/site-links";
import type { Article, RecipeDifficulty } from "@/lib/types/database";
import {
  DEFAULT_RECIPE_CARD_IMAGE,
  DEFAULT_RECIPE_HERO_DESKTOP,
  DEFAULT_RECIPE_HERO_MOBILE,
  DEFAULT_RECIPE_PAGE_SETTINGS,
  RECIPE_PAGE_CATEGORY_CHIPS,
  normalizeRecipeCategorySlug,
  type RecipePageSettings,
} from "@/lib/recipes/page-settings";
import { cn } from "@/lib/utils";

type RecipeListItem = {
  id: string;
  title: string;
  slug?: string | null;
  href?: string;
  cover_image?: string | null;
  cover_image_url?: string | null;
  coverImage?: string | null;
  featured_image?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  summary?: string | null;
  difficulty: RecipeDifficulty;
  published_at?: string | null;
  is_featured?: boolean;
  ingredient_names?: string[];
  prep_time?: number | null;
  cook_time?: number | null;
  total_time?: number | null;
  recipe_categories?: {
    id?: string;
    name?: string;
    slug?: string;
  } | null;
};

type RecipesPageSettingsResponse = RecipePageSettings & {
  hero: RecipePageSettings["hero"] & {
    href?: string | null;
    is_live?: boolean;
  };
};

const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  easy: "初階",
  medium: "進階",
  hard: "挑戰",
};

const DIFFICULTY_CLASS: Record<RecipeDifficulty, string> = {
  easy: "bg-[#FFF5CC] text-[#153E73]",
  medium: "bg-[#EAF6FD] text-[#153E73]",
  hard: "bg-[#FFE8E2] text-[#F16458]",
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

function recipeHref(recipe: Pick<RecipeListItem, "slug" | "href" | "id">) {
  if (recipe.slug) return `/recipes/${recipe.slug}`;
  if (recipe.href) return recipe.href;
  return recipe.id ? `/recipes/${recipe.id}` : null;
}

function articleHref(article: Pick<Article, "slug">) {
  return article.slug ? `/articles/${article.slug}` : null;
}

function recipeDuration(recipe: RecipeListItem) {
  return recipe.total_time ?? (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);
}

function normalizeRecipeRecordCategory(recipe: RecipeListItem) {
  return normalizeRecipeCategorySlug(recipe.recipe_categories?.slug ?? recipe.recipe_categories?.name ?? null);
}

function matchesRecipeQuery(recipe: RecipeListItem, query: string) {
  if (!query) return true;
  const haystack = [
    recipe.title,
    recipe.summary ?? "",
    recipe.recipe_categories?.name ?? "",
    ...(recipe.ingredient_names ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function matchesArticleQuery(article: Article, query: string) {
  if (!query) return true;
  return [article.title, article.content ?? "", article.article_categories?.name ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function isKnowledgeArticle(article: Article) {
  const slug = (article.article_categories?.slug ?? "").toLowerCase();
  const name = (article.article_categories?.name ?? "").toLowerCase();
  return (
    slug.includes("knowledge") ||
    slug.includes("baking") ||
    name.includes("知識") ||
    name.includes("烘焙")
  );
}

function getRecipeImage(recipe: RecipeListItem) {
  return (
    recipe.cover_image_url ||
    recipe.cover_image ||
    recipe.coverImage ||
    recipe.featured_image ||
    recipe.image_url ||
    recipe.thumbnail_url ||
    DEFAULT_RECIPE_CARD_IMAGE
  );
}

function RecipeCoverImage({
  recipe,
  sizes,
  className,
}: {
  recipe: RecipeListItem;
  sizes: string;
  className?: string;
}) {
  const [src, setSrc] = useState(() => getRecipeImage(recipe));
  return (
    <Image
      src={src}
      alt={recipe.title}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      unoptimized
      onError={() => {
        if (src !== DEFAULT_RECIPE_CARD_IMAGE) setSrc(DEFAULT_RECIPE_CARD_IMAGE);
      }}
    />
  );
}

function SectionTitle({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-[22px] font-bold tracking-tight text-[#153E73]">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#153E73]"
        >
          查看全部
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function RecipeHeroBanner({ hero }: { hero: RecipesPageSettingsResponse["hero"] }) {
  // Hidden only when CMS explicitly turns the banner off.
  if (hero.is_live === false || hero.is_active === false) return null;

  const alt = hero.alt_text || "CHIMEIDIY 烘焙圖書館";
  const href = hero.href ?? null;
  const openInNewTab = hero.open_in_new_tab && Boolean(href);
  const desktopHero = hero.desktop_image_url || DEFAULT_RECIPE_HERO_DESKTOP;
  const mobileHero = hero.mobile_image_url || DEFAULT_RECIPE_HERO_MOBILE;

  const media = (
    <section className="relative w-full overflow-hidden bg-[#FEE169]">
      <picture>
        <source media="(min-width: 768px)" srcSet={desktopHero} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileHero}
          alt={alt}
          className="block h-auto w-full"
          width={885}
          height={392}
        />
      </picture>
    </section>
  );

  if (!href) return media;

  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer noopener" : undefined}
      className="block"
      aria-label={alt}
    >
      {media}
    </Link>
  );
}

function RecipeCardSkeleton() {
  return (
    <div className="w-[82%] shrink-0 rounded-[16px] border border-[#E8E1D7] bg-white p-3 shadow-[0_10px_24px_rgba(21,62,115,0.06)] sm:w-[320px] md:w-auto">
      <div className="aspect-[4/3] animate-pulse rounded-[14px] bg-[#F4EFE6]" />
      <div className="mt-3 h-5 w-20 animate-pulse rounded-full bg-[#F4EFE6]" />
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-[#F4EFE6]" />
    </div>
  );
}

function LatestCardSkeleton() {
  return <div className="h-[112px] animate-pulse rounded-[16px] bg-[#F4EFE6]" />;
}

function EmptyRecipesState({
  onClear,
  filtered = true,
}: {
  onClear: () => void;
  filtered?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[#E8E1D7] bg-white px-6 py-10 text-center shadow-[0_10px_24px_rgba(21,62,115,0.05)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5CC] text-[#153E73]">
        <BookOpen className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#153E73]">
        {filtered ? "書架上還沒有符合的食譜" : "尚無食譜"}
      </h3>
      <p className="mt-2 text-sm leading-7 text-[#5E6B84]">
        {filtered ? "換個關鍵字或分類，再找找看吧！" : "新食譜準備中，請稍後再來逛逛。"}
      </p>
      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-[#153E73] px-5 text-sm font-semibold text-[#153E73]"
        >
          清除篩選
        </button>
      ) : null}
    </div>
  );
}

export function RecipesClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = normalizeRecipeCategorySlug(searchParams.get("category"));

  const [settings, setSettings] = useState<RecipesPageSettingsResponse>(DEFAULT_RECIPE_PAGE_SETTINGS);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [rawQuery, setRawQuery] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const debouncedQuery = useDebouncedValue(rawQuery.trim().toLowerCase(), 300);

  const syncUrl = useCallback(
    (nextQuery: string, nextCategory: string) => {
      const params = new URLSearchParams();
      if (nextQuery) params.set("q", nextQuery);
      if (nextCategory !== "all") params.set("category", nextCategory);
      const next = params.toString() ? `${pathname}?${params}` : pathname;
      const current = searchParams.toString() ? `${pathname}?${searchParams}` : pathname;
      if (next !== current) {
        router.replace(next, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, recipesRes, articlesRes, authRes] = await Promise.all([
        fetch("/api/recipes/page-settings", { cache: "no-store" }),
        fetch("/api/recipes", { cache: "no-store" }),
        fetch("/api/articles", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      const [settingsJson, recipesJson, articlesJson, authJson] = await Promise.all([
        settingsRes.json().catch(() => ({})),
        recipesRes.json().catch(() => ({})),
        articlesRes.json().catch(() => ({})),
        authRes.json().catch(() => ({})),
      ]);

      if (!recipesRes.ok) throw new Error(recipesJson.error ?? "食譜載入失敗");

      setSettings(
        (settingsRes.ok
          ? settingsJson.settings ?? DEFAULT_RECIPE_PAGE_SETTINGS
          : DEFAULT_RECIPE_PAGE_SETTINGS) as RecipesPageSettingsResponse
      );
      setRecipes((recipesJson.recipes ?? []) as RecipeListItem[]);
      setArticles(articlesRes.ok ? ((articlesJson.articles ?? []) as Article[]) : []);
      setLoggedIn(authRes.ok && Boolean(authJson.user));
      setAuthResolved(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入失敗");
      setAuthResolved(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (urlQuery !== rawQuery) setRawQuery(urlQuery);
    if (urlCategory !== category) setCategory(urlCategory);
  }, [category, rawQuery, urlCategory, urlQuery]);

  useEffect(() => {
    syncUrl(debouncedQuery, category);
  }, [category, debouncedQuery, syncUrl]);

  const filteredRecipes = useMemo(() => {
    if (category === "knowledge") return [];
    return recipes
      .filter((recipe) => category === "all" || normalizeRecipeRecordCategory(recipe) === category)
      .filter((recipe) => matchesRecipeQuery(recipe, debouncedQuery))
      .sort((a, b) => {
        const aTime = new Date(a.published_at ?? 0).getTime();
        const bTime = new Date(b.published_at ?? 0).getTime();
        return bTime - aTime;
      });
  }, [category, debouncedQuery, recipes]);

  const recommendedRecipes = useMemo(() => {
    const featured = filteredRecipes.filter((recipe) => recipe.is_featured && recipeHref(recipe));
    const source = featured.length > 0 ? featured : filteredRecipes.filter((recipe) => recipeHref(recipe));
    return source.slice(0, 3);
  }, [filteredRecipes]);

  const latestRecipes = useMemo(
    () => filteredRecipes.filter((recipe) => recipeHref(recipe)).slice(0, 3),
    [filteredRecipes]
  );

  const visibleKnowledgeArticles = useMemo(() => {
    const source = articles.filter((article) =>
      category === "knowledge" ? isKnowledgeArticle(article) : true
    );
    const filtered = source
      .filter((article) => matchesArticleQuery(article, debouncedQuery))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const preferred = filtered.filter(isKnowledgeArticle);
    return (preferred.length ? preferred : filtered).slice(0, 2);
  }, [articles, category, debouncedQuery]);

  const hasActiveFilter = Boolean(debouncedQuery) || (category !== "all" && category !== "knowledge");
  const showRecipeEmpty =
    !loading && !error && category !== "knowledge" && filteredRecipes.length === 0;
  const showKnowledgeEmpty = !loading && !error && visibleKnowledgeArticles.length === 0;
  const heroVisible = settings.hero.is_live !== false && settings.hero.is_active !== false;
  const loginHref = `${APP_ROUTES.login}?next=${encodeURIComponent(
    searchParams.toString() ? `${pathname}?${searchParams}` : pathname
  )}`;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FFFEFA] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#153E73] md:pb-10">
      <RecipeHeroBanner hero={settings.hero} />

      <div className="mx-auto w-full max-w-[1120px] px-5 pb-10 md:px-8">
        <div
          className={cn(
            "relative z-20 mx-auto w-full",
            heroVisible ? "-mt-5 md:-mt-7" : "mt-5"
          )}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              syncUrl(rawQuery.trim(), category);
            }}
            className="flex min-h-[56px] items-center gap-3 rounded-[20px] bg-white px-4 shadow-[0_12px_28px_rgba(21,62,115,0.10)] md:min-h-[60px] md:px-5"
            role="search"
          >
            <Search className="h-5 w-5 shrink-0 text-[#6F7B90]" aria-hidden />
            <label htmlFor="recipes-search" className="sr-only">
              搜尋食譜、材料或關鍵字
            </label>
            <input
              id="recipes-search"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="搜尋食譜、材料或關鍵字"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#8A94A6]"
              autoComplete="off"
            />
            {rawQuery ? (
              <button
                type="button"
                aria-label="清除搜尋"
                onClick={() => setRawQuery("")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#6F7B90]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </form>
        </div>

        <div className="mt-6 -mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0">
          <div className="flex min-w-max items-center gap-3 md:min-w-0 md:flex-wrap">
            {RECIPE_PAGE_CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.slug}
                type="button"
                onClick={() => setCategory(chip.slug)}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition",
                  category === chip.slug
                    ? "border-[#FEE169] bg-[#FEE169] font-bold text-[#153E73]"
                    : "border-[#E8E1D7] bg-white text-[#153E73]"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-10 md:mt-10 md:space-y-12">
          {error ? (
            <div className="rounded-[20px] border border-red-200 bg-red-50 px-6 py-8 text-center">
              <p className="text-base font-semibold text-red-700">食譜載入失敗，請稍後再試</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-red-300 px-5 text-sm font-semibold text-red-700"
              >
                重新載入
              </button>
            </div>
          ) : null}

          {!error ? (
            <>
              {category !== "knowledge" ? (
                <>
                  <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}
                    className="space-y-4"
                  >
                    <SectionTitle title="推薦食譜" href="/recipes" />
                    {loading ? (
                      <div className="flex gap-4 overflow-hidden md:grid md:grid-cols-3 md:gap-5">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <RecipeCardSkeleton key={index} />
                        ))}
                      </div>
                    ) : showRecipeEmpty ? (
                      <EmptyRecipesState
                        filtered={hasActiveFilter}
                        onClear={() => {
                          setRawQuery("");
                          setCategory("all");
                        }}
                      />
                    ) : recommendedRecipes.length > 0 ? (
                      <>
                        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:pb-0">
                          {recommendedRecipes.map((recipe, index) => {
                            const href = recipeHref(recipe);
                            return (
                              <motion.article
                                key={recipe.id}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.24, delay: index * 0.04 }}
                                className="w-[78vw] max-w-[320px] shrink-0 snap-start rounded-[16px] border border-[#E8E1D7] bg-white p-3 shadow-[0_10px_24px_rgba(21,62,115,0.06)] md:w-auto md:max-w-none"
                              >
                                <div className="relative">
                                  {href ? (
                                    <Link href={href} className="block" aria-label={recipe.title}>
                                      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-[#FFF5CC]">
                                        <RecipeCoverImage
                                          recipe={recipe}
                                          sizes="(max-width: 767px) 80vw, 33vw"
                                        />
                                      </div>
                                    </Link>
                                  ) : (
                                    <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-[#FFF5CC]">
                                      <RecipeCoverImage
                                        recipe={recipe}
                                        sizes="(max-width: 767px) 80vw, 33vw"
                                      />
                                    </div>
                                  )}
                                  <div className="absolute right-2 top-2">
                                    <FavoriteButton
                                      targetType="recipe"
                                      targetId={recipe.id}
                                      size="sm"
                                      className="border border-white/70 bg-white/95 shadow-[0_10px_18px_rgba(21,62,115,0.12)]"
                                    />
                                  </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <span
                                    className={cn(
                                      "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold",
                                      DIFFICULTY_CLASS[recipe.difficulty]
                                    )}
                                  >
                                    {DIFFICULTY_LABELS[recipe.difficulty]}
                                  </span>
                                </div>
                                {href ? (
                                  <Link href={href} className="mt-3 block">
                                    <h3 className="line-clamp-2 text-base font-bold leading-7 text-[#153E73]">
                                      {recipe.title}
                                    </h3>
                                  </Link>
                                ) : (
                                  <h3 className="mt-3 line-clamp-2 text-base font-bold leading-7 text-[#153E73]">
                                    {recipe.title}
                                  </h3>
                                )}
                              </motion.article>
                            );
                          })}
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-[#D8A66A]" aria-hidden />
                      </>
                    ) : null}
                  </motion.section>

                  <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.04 }}
                    className="space-y-4"
                  >
                    <SectionTitle title="最新食譜" href="/recipes" />
                    {loading ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <LatestCardSkeleton key={index} />
                        ))}
                      </div>
                    ) : latestRecipes.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {latestRecipes.map((recipe, index) => {
                          const href = recipeHref(recipe);
                          return (
                            <motion.article
                              key={recipe.id}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.24, delay: index * 0.05 }}
                              className="grid grid-cols-[96px_1fr_auto] items-center gap-4 rounded-2xl border border-[#E8E1D7] bg-white p-3 shadow-[0_6px_18px_rgba(21,62,115,0.05)]"
                            >
                              {href ? (
                                <Link
                                  href={href}
                                  className="relative block h-[72px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-[#FFF5CC]"
                                  aria-label={recipe.title}
                                >
                                  <RecipeCoverImage recipe={recipe} sizes="96px" />
                                </Link>
                              ) : (
                                <div className="relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-[#FFF5CC]">
                                  <RecipeCoverImage recipe={recipe} sizes="96px" />
                                </div>
                              )}

                              <div className="min-w-0">
                                {href ? (
                                  <Link href={href}>
                                    <h3 className="line-clamp-2 text-sm font-bold leading-6 text-[#153E73]">
                                      {recipe.title}
                                    </h3>
                                  </Link>
                                ) : (
                                  <h3 className="line-clamp-2 text-sm font-bold leading-6 text-[#153E73]">
                                    {recipe.title}
                                  </h3>
                                )}
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5E6B84]">
                                  <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-[#FFF7E8] px-3">
                                    <Clock3 className="h-3.5 w-3.5" aria-hidden />
                                    {recipeDuration(recipe)} 分
                                  </span>
                                  <span
                                    className={cn(
                                      "inline-flex min-h-8 items-center rounded-full px-3 font-semibold",
                                      DIFFICULTY_CLASS[recipe.difficulty]
                                    )}
                                  >
                                    {DIFFICULTY_LABELS[recipe.difficulty]}
                                  </span>
                                </div>
                              </div>

                              <FavoriteButton
                                targetType="recipe"
                                targetId={recipe.id}
                                size="sm"
                                className="shrink-0 border border-[#E8E1D7] bg-white"
                              />
                            </motion.article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-[18px] border border-[#E8E1D7] bg-white px-5 py-8 text-center text-sm text-[#5E6B84]">
                        尚無最新食譜
                      </div>
                    )}
                  </motion.section>
                </>
              ) : null}

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.08 }}
                className="space-y-4"
              >
                <SectionTitle title="烘焙知識" href="/articles" />
                {loading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="overflow-hidden rounded-[14px] bg-white p-2 shadow-[0_8px_18px_rgba(21,62,115,0.05)]">
                        <div className="aspect-[16/9] animate-pulse rounded-[12px] bg-[#F4EFE6]" />
                        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-[#F4EFE6]" />
                        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-[#F4EFE6]" />
                      </div>
                    ))}
                  </div>
                ) : showKnowledgeEmpty ? (
                  <div className="rounded-[18px] border border-[#E8E1D7] bg-white px-5 py-8 text-center text-sm text-[#5E6B84]">
                    烘焙知識文章準備中
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {visibleKnowledgeArticles.map((article) => {
                      const href = articleHref(article);
                      const cardContent = (
                        <>
                          <div className="relative aspect-[16/9] overflow-hidden rounded-[12px] bg-[#FFF5CC]">
                            {article.cover_image ? (
                              <Image
                                src={article.cover_image}
                                alt={article.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : null}
                          </div>
                          <div className="space-y-1 p-1">
                            <p className="text-[11px] font-semibold text-[#79C7E8]">
                              {article.article_categories?.name ?? "烘焙知識"}
                            </p>
                            <h3 className="line-clamp-2 min-h-[3rem] text-sm font-bold leading-6 text-[#153E73]">
                              {article.title}
                            </h3>
                            <p className="text-[11px] text-[#8A94A6]">
                              {new Date(article.created_at).toLocaleDateString("zh-TW")}
                            </p>
                          </div>
                        </>
                      );

                      return href ? (
                        <Link
                          key={article.id}
                          href={href}
                          className="rounded-[14px] border border-[#E8E1D7] bg-white p-2 shadow-[0_8px_18px_rgba(21,62,115,0.05)]"
                        >
                          {cardContent}
                        </Link>
                      ) : (
                        <article
                          key={article.id}
                          className="rounded-[14px] border border-[#E8E1D7] bg-white p-2 shadow-[0_8px_18px_rgba(21,62,115,0.05)]"
                        >
                          {cardContent}
                        </article>
                      );
                    })}
                  </div>
                )}
              </motion.section>

              {authResolved && !loggedIn ? (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.12 }}
                  className="rounded-[16px] border border-[#153E73] bg-[#FFF5CC] p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#153E73]">
                        <SquarePen className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-[#153E73]">收藏你的烘焙靈感</h3>
                        <p className="mt-1 text-sm leading-7 text-[#5E6B84]">
                          登入後即可收藏食譜，隨時回來繼續閱讀
                        </p>
                      </div>
                    </div>
                    <Link
                      href={loginHref}
                      className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#153E73] px-4 text-sm font-semibold text-white sm:w-auto"
                    >
                      立即登入
                    </Link>
                  </div>
                </motion.section>
              ) : null}
            </>
          ) : null}
        </div>

        <footer className="mt-12 border-t border-[#EFE6DB] pt-8 pb-4 text-center text-sm text-[#667085]">
          <p className="font-semibold text-[#153E73]">CHIMEIDIY Lifestyle</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <span>關於我們</span>
            <Link href="/support/contact" className="text-[#153E73]">
              聯絡我們
            </Link>
            <Link href="/privacy" className="text-[#153E73]">
              隱私權政策
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
