"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import { DesktopInnerPageLayout } from "@/components/desktop/layout/DesktopInnerPageLayout";
import { DesktopPagination } from "@/components/desktop/layout/DesktopPagination";
import {
  INNER_PAGE_HEROES,
  RECIPE_FILTERS,
  RECIPE_SIDEBAR_ITEMS,
} from "@/lib/desktop/inner-page-config";
import { normalizeRecipeCategorySlug } from "@/lib/recipes/page-settings";
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
  recipe_categories?: { name?: string; slug?: string } | null;
};

const DIFFICULTY: Record<string, string> = {
  easy: "初階",
  medium: "進階",
  hard: "挑戰",
};

const PAGE_SIZE = 12;

export function DesktopRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
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

  const filtered = useMemo(() => {
    let list = [...recipes];
    if (category !== "all") {
      list = list.filter((r) => {
        const slug = normalizeRecipeCategorySlug(
          r.recipe_categories?.slug ?? r.recipe_categories?.name
        );
        if (category === "festival") {
          return (r.title || "").includes("節") || slug.includes("festival");
        }
        if (category === "beginner") return r.difficulty === "easy" || slug === "kids-baking";
        if (category === "tips" || category === "video") return slug === "knowledge" || true;
        return slug === category;
      });
    }
    const times = filters.time ?? [];
    if (times.length) {
      list = list.filter((r) => {
        const mins = Number(r.total_time ?? r.prep_time ?? r.cook_time ?? 0);
        return times.some((t) => {
          if (t === "lt30") return mins > 0 && mins <= 30;
          if (t === "30to60") return mins > 30 && mins <= 60;
          if (t === "gt60") return mins > 60;
          return true;
        });
      });
    }
    const diffs = filters.difficulty ?? [];
    if (diffs.length) {
      list = list.filter((r) => r.difficulty && diffs.includes(r.difficulty));
    }
    if (sort === "time") {
      list.sort(
        (a, b) =>
          Number(a.total_time ?? a.prep_time ?? 999) -
          Number(b.total_time ?? b.prep_time ?? 999)
      );
    }
    return list;
  }, [recipes, category, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [category, filters, sort]);

  return (
    <DesktopInnerPageLayout
      hero={INNER_PAGE_HEROES.recipes}
      breadcrumb={[
        { label: "首頁", href: APP_ROUTES.home },
        { label: "食譜" },
      ]}
      sidebar={{
        title: "食譜分類",
        items: RECIPE_SIDEBAR_ITEMS,
        activeKey: category,
        onItemSelect: setCategory,
        filters: RECIPE_FILTERS,
        selectedFilters: filters,
        onFilterChange: (key, values) =>
          setFilters((prev) => ({ ...prev, [key]: values })),
        onClearFilters: () => setFilters({}),
      }}
      toolbar={{
        title: "全部食譜",
        description:
          "探索更多美味食譜，從經典到創意，讓烘焙成為生活中的幸福日常。",
        totalLabel: loading ? "載入中…" : `共 ${filtered.length} 篇食譜`,
        sortValue: sort,
        sortOptions: [
          { value: "newest", label: "最新上架" },
          { value: "time", label: "製作時間" },
        ],
        onSortChange: setSort,
      }}
      footerSlot={
        <DesktopPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      }
    >
      <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
        {pageItems.map((r) => {
          const cover = r.cover_image_url || r.cover_image;
          const mins = r.total_time ?? r.prep_time ?? r.cook_time;
          return (
            <article
              key={r.id}
              className="group overflow-hidden rounded-[16px] border border-[#E9EDF2] bg-white transition duration-150 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <Link
                href={`/recipes/${r.slug || r.id}`}
                className="relative block aspect-[4/3] bg-[#EEF8FC]"
              >
                {cover ? (
                  <Image src={cover} alt={r.title} fill className="object-cover" sizes="25vw" />
                ) : null}
                <span className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
                  <FavoriteButton
                    targetType="recipe"
                    targetId={r.id}
                    size="sm"
                    className="text-[#F16458]"
                  />
                </span>
              </Link>
              <div className="space-y-2 p-3">
                <Link
                  href={`/recipes/${r.slug || r.id}`}
                  className="line-clamp-2 text-sm font-semibold text-[#153E73]"
                >
                  {r.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#687386]">
                  {mins != null ? <span>{mins} 分</span> : null}
                  {r.difficulty ? (
                    <span
                      className={cn(
                        "rounded-full bg-[#FFF5CC] px-2 py-0.5 font-semibold text-[#153E73]"
                      )}
                    >
                      {DIFFICULTY[r.difficulty] ?? r.difficulty}
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!loading && pageItems.length === 0 ? (
        <p className="py-16 text-center text-[#687386]">沒有符合的食譜</p>
      ) : null}
    </DesktopInnerPageLayout>
  );
}
