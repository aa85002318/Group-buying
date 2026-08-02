"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AIFeaturedRecipe } from "@/components/shop/inspiration/AIFeaturedRecipe";
import { InspirationCategoryMenu } from "@/components/shop/inspiration/InspirationCategoryMenu";
import { InspirationRecipeCarousel } from "@/components/shop/inspiration/InspirationRecipeCarousel";
import { AIInspirationPrompt } from "@/components/shop/inspiration/AIInspirationPrompt";
import {
  DEMO_INSPIRATION_RECIPES,
  filterInspirationByCategory,
  INSPIRATION_WALL_CATEGORIES,
  pickFeaturedInspiration,
  type InspirationCategoryItem,
  type InspirationRecipe,
} from "@/lib/shop/inspiration-wall";

/**
 * Version C｜AI 靈感探索版 — 烘焙靈感牆
 */
export function ShopInspirationWall() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("inspiration") || "hot";

  const [categories, setCategories] = useState<InspirationCategoryItem[]>(
    INSPIRATION_WALL_CATEGORIES
  );
  const [featured, setFeatured] = useState<InspirationRecipe | null>(
    DEMO_INSPIRATION_RECIPES[0]
  );
  const [allRecipes, setAllRecipes] = useState<InspirationRecipe[]>(
    DEMO_INSPIRATION_RECIPES
  );
  const [activeSlug, setActiveSlug] = useState(initialCat);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("inspiration");
    if (fromUrl && fromUrl !== activeSlug) setActiveSlug(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync URL → state only
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    (async () => {
      try {
        const [featRes, catRes] = await Promise.all([
          fetch("/api/shop/inspiration/featured", {
            cache: "no-store",
            signal: ctrl.signal,
          }),
          fetch("/api/shop/inspiration/categories", {
            cache: "no-store",
            signal: ctrl.signal,
          }),
        ]);
        const featJson = await featRes.json().catch(() => ({}));
        const catJson = await catRes.json().catch(() => ({}));
        if (cancelled) return;
        if (Array.isArray(catJson.categories) && catJson.categories.length) {
          setCategories(catJson.categories);
        }
        const list = Array.isArray(featJson.recipes)
          ? (featJson.recipes as InspirationRecipe[])
          : DEMO_INSPIRATION_RECIPES;
        setAllRecipes(list.length ? list : DEMO_INSPIRATION_RECIPES);
        setFeatured(
          (featJson.recipe as InspirationRecipe | null) ??
            pickFeaturedInspiration(list) ??
            DEMO_INSPIRATION_RECIPES[0]
        );
      } catch {
        if (!cancelled) {
          setAllRecipes(DEMO_INSPIRATION_RECIPES);
          setFeatured(DEMO_INSPIRATION_RECIPES[0]);
        }
      } finally {
        clearTimeout(timer);
        if (!cancelled) setLoadingFeatured(false);
      }
    })();
    return () => {
      cancelled = true;
      ctrl.abort();
      clearTimeout(timer);
    };
  }, []);

  const loadCategory = useCallback(async (slug: string) => {
    setLoadingList(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(
        `/api/shop/inspiration/recipes?category=${encodeURIComponent(slug)}&limit=12`,
        { cache: "no-store", signal: ctrl.signal }
      );
      const json = await res.json().catch(() => ({}));
      if (Array.isArray(json.recipes) && json.recipes.length) {
        setAllRecipes(json.recipes);
      } else {
        setAllRecipes(filterInspirationByCategory(DEMO_INSPIRATION_RECIPES, slug));
      }
    } catch {
      setAllRecipes(filterInspirationByCategory(DEMO_INSPIRATION_RECIPES, slug));
    } finally {
      clearTimeout(timer);
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadCategory(activeSlug);
  }, [activeSlug, loadCategory]);

  const onCategoryChange = (slug: string) => {
    setActiveSlug(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "hot") params.delete("inspiration");
    else params.set("inspiration", slug);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const listRecipes =
    allRecipes.length > 0
      ? allRecipes
      : filterInspirationByCategory(DEMO_INSPIRATION_RECIPES, activeSlug);

  return (
    <section
      className="shop-inspiration-wall-v2 w-full bg-[#FFFDF6]"
      aria-label="烘焙靈感牆"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 py-7 md:px-6 md:py-10">
        <div className="mb-5 flex items-end justify-between gap-3 md:mb-6">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-tight text-[#153E73] md:text-[26px]">
              烘焙靈感牆
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#687386] md:text-[14px]">
              不知道做什麼？AI 幫你推薦今天的靈感！
            </p>
          </div>
          <Link
            href="/recipes"
            className="shrink-0 text-[13px] font-bold text-[#153E73] transition hover:text-[#F0645A] md:text-[14px]"
          >
            查看更多 ＞
          </Link>
        </div>

        <AIFeaturedRecipe recipe={featured} loading={loadingFeatured} />

        <div className="mt-6 md:mt-7">
          <InspirationCategoryMenu
            categories={categories}
            activeSlug={activeSlug}
            onChange={onCategoryChange}
            loading={loadingFeatured}
          />
        </div>

        <div className="mt-5 md:mt-6">
          <InspirationRecipeCarousel
            recipes={listRecipes.slice(0, 12)}
            loading={loadingList}
          />
        </div>

        <AIInspirationPrompt />
      </div>
    </section>
  );
}
