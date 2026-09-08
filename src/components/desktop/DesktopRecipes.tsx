"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import {
  DEFAULT_RECIPE_HERO_DESKTOP,
  RECIPE_PAGE_CATEGORY_CHIPS,
  normalizeRecipeCategorySlug,
} from "@/lib/recipes/page-settings";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

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
  is_featured?: boolean;
  recipe_categories?: { name?: string; slug?: string } | null;
};

const DIFFICULTY: Record<string, string> = {
  easy: "初階",
  medium: "進階",
  hard: "挑戰",
};

export function DesktopRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRecipes(d.recipes ?? []);
      })
      .catch(() => {
        if (!cancelled) setRecipes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = useMemo(
    () => recipes.find((r) => r.is_featured) ?? recipes[0] ?? null,
    [recipes]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (category !== "all") {
        const slug = normalizeRecipeCategorySlug(r.recipe_categories?.slug ?? r.recipe_categories?.name);
        if (slug !== category) return false;
      }
      if (!q) return true;
      return r.title.toLowerCase().includes(q);
    });
  }, [recipes, query, category]);

  return (
    <div className="bg-[var(--cream,#FFFDF9)]">
      <section className="relative h-[280px] w-full overflow-hidden bg-[#F7F2EA] xl:h-[320px]">
        <Image
          src={DEFAULT_RECIPE_HERO_DESKTOP}
          alt="食譜"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        <DesktopContainer className="relative flex h-full flex-col justify-center text-white">
          <h1 className="text-4xl font-bold">食譜影音</h1>
          <p className="mt-2 max-w-lg text-base opacity-95">跟著步驟做，烘焙更簡單</p>
        </DesktopContainer>
      </section>

      <DesktopContainer className="py-8">
        <form
          className="mb-6 flex max-w-2xl overflow-hidden rounded-full border border-[#E5D9C8] bg-white"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋食譜…"
            className="min-w-0 flex-1 px-5 py-3 text-sm outline-none"
          />
          <span className="inline-flex items-center gap-2 px-5 text-sm font-semibold text-[#153E73]">
            <Search className="h-4 w-4" />
            搜尋
          </span>
        </form>

        <div className="mb-8 flex flex-wrap gap-2">
          {RECIPE_PAGE_CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.slug}
              type="button"
              onClick={() => setCategory(chip.slug)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold",
                category === chip.slug ? "bg-[#153E73] text-white" : "bg-white text-[#5E4035]"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {featured ? (
          <div className="mb-10 grid gap-6 overflow-hidden rounded-3xl bg-white lg:grid-cols-2">
            <Link
              href={`/recipes/${featured.slug || featured.id}`}
              className="relative min-h-[240px] bg-[#F7F2EA]"
            >
              {(featured.cover_image_url || featured.cover_image) && (
                <Image
                  src={(featured.cover_image_url || featured.cover_image)!}
                  alt={featured.title}
                  fill
                  className="object-cover"
                  sizes="(min-width:1024px) 40vw, 100vw"
                />
              )}
            </Link>
            <div className="flex flex-col justify-center p-8">
              <p className="text-sm font-semibold text-[#B56A45]">精選食譜</p>
              <h2 className="mt-2 text-2xl font-bold text-[#153E73]">{featured.title}</h2>
              <Link
                href={`/recipes/${featured.slug || featured.id}`}
                className="mt-6 inline-flex w-fit rounded-full bg-[#FEE169] px-5 py-2.5 text-sm font-bold text-[#153E73]"
              >
                立即查看
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-5 xl:grid-cols-4">
          {filtered.map((r) => {
            const cover = r.cover_image_url || r.cover_image;
            const mins = r.total_time ?? r.prep_time ?? r.cook_time;
            return (
              <article key={r.id} className="overflow-hidden rounded-2xl bg-white">
                <Link
                  href={`/recipes/${r.slug || r.id}`}
                  className="relative block aspect-[4/3] bg-[#F7F2EA]"
                >
                  {cover ? (
                    <Image src={cover} alt={r.title} fill className="object-cover" sizes="25vw" />
                  ) : null}
                  <span className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
                    <FavoriteButton targetType="recipe" targetId={r.id} size="sm" />
                  </span>
                </Link>
                <div className="space-y-1 p-3">
                  <Link
                    href={`/recipes/${r.slug || r.id}`}
                    className="line-clamp-2 text-sm font-bold text-[#153E73]"
                  >
                    {r.title}
                  </Link>
                  <p className="text-xs text-[#9A7B6C]">
                    {mins != null ? `${mins} 分` : null}
                    {mins != null && r.difficulty ? " · " : null}
                    {r.difficulty ? DIFFICULTY[r.difficulty] ?? r.difficulty : null}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && filtered.length === 0 ? (
          <p className="py-16 text-center text-[#9A7B6C]">沒有符合的食譜</p>
        ) : null}

        <div className="mt-10 text-center">
          <Link href={APP_ROUTES.recipes} className="text-sm font-semibold text-[#B56A45]">
            重新整理列表
          </Link>
        </div>
      </DesktopContainer>
    </div>
  );
}
