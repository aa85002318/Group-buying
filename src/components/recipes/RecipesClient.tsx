"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RecipeCard } from "@/components/consumer/RecipeCard";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import type { RecipeSummary } from "@/lib/consumer-hub";
import type { RecipeCategory } from "@/lib/types/database";
import { MOCK_RECIPES } from "@/lib/mock/consumer-hub";
import { MOCK_RECIPE_CATEGORIES } from "@/lib/mock/recipes";

const DIFFICULTY_OPTIONS = [
  { value: "", label: "全部難度" },
  { value: "easy", label: "初學" },
  { value: "medium", label: "進階" },
  { value: "hard", label: "挑戰" },
];

export function RecipesClient() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>(MOCK_RECIPES);
  const [categories, setCategories] = useState<RecipeCategory[]>(MOCK_RECIPE_CATEGORIES);
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    if (q.trim()) params.set("q", q.trim());

    fetch(`/api/recipes?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setRecipes(d.recipes ?? []);
        if (d.categories?.length) setCategories(d.categories);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, difficulty]);

  const featured = useMemo(() => recipes.filter((r) => r.href).slice(0, 1), [recipes]);
  const latest = recipes;

  const categoryTabs = [
    { slug: "all", name: "全部" },
    ...categories.filter((c) => c.slug !== "all"),
  ];

  return (
    <div className="space-y-8 page-enter">
      <header>
        <h1 className="text-2xl font-bold text-caramel">食譜影音</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          找食譜、看教學，把烘焙變得更簡單
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="min-h-12 flex-1 rounded-2xl border border-border-soft bg-cream px-4 text-sm outline-none focus:border-primary"
          placeholder="搜尋食譜名稱、食材或類型"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select
          className="min-h-12 rounded-2xl border border-border-soft bg-surface px-3 text-sm"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {DIFFICULTY_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          className="min-h-12 rounded-2xl bg-primary px-5 text-sm font-semibold text-white"
        >
          搜尋
        </button>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categoryTabs.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              category === c.slug
                ? "bg-primary text-white"
                : "bg-surface text-caramel border border-border-soft"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[18px] border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-800">{error}</p>
          <button type="button" className="mt-2 text-sm text-primary underline" onClick={load}>
            重新載入
          </button>
        </div>
      ) : recipes.length === 0 ? (
        <div className="rounded-[18px] bg-surface p-10 text-center shadow-card">
          <p className="font-medium text-foreground">目前沒有符合的食譜</p>
          <p className="mt-1 text-sm text-foreground-secondary">試試其他分類或關鍵字</p>
        </div>
      ) : (
        <>
          {featured[0] && (
            <section>
              <SectionHeader title="精選食譜" accentClass="bg-primary" />
              <div className="max-w-md">
                <RecipeCard recipe={featured[0]} />
              </div>
            </section>
          )}

          <section>
            <SectionHeader title="最新食譜" href="/recipes" accentClass="bg-caramel" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </section>
        </>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "一分鐘教你做", href: "/videos", desc: "短影音快速上手" },
          { title: "熱門影音", href: "/videos", desc: "完整教學與技巧" },
          { title: "直播回放", href: "/live", desc: "回看直播精華" },
          { title: "烘焙知識", href: "/articles", desc: "原理與常見問題" },
          { title: "收藏食譜", href: "/member/favorites", desc: "登入後管理收藏" },
        ].map((b) => (
          <Link
            key={b.title}
            href={b.href}
            className="rounded-[18px] border border-border-soft bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(74,49,36,0.08)]"
          >
            <h3 className="font-semibold text-caramel">{b.title}</h3>
            <p className="mt-1 text-sm text-foreground-secondary">{b.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
