"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IngredientList } from "@/components/recipes/IngredientList";
import { RecipeStepList } from "@/components/recipes/RecipeStepList";
import { VideoEmbed } from "@/components/videos/VideoEmbed";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import type { Recipe } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

const DIFFICULTY: Record<string, string> = {
  easy: "初學",
  medium: "進階",
  hard: "挑戰",
};

export function RecipeDetailClient({ slug }: { slug: string }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [related, setRelated] = useState<
    Array<{ id: string; title: string; slug: string; cover_image?: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/recipes/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setRecipe(d.recipe);
        setRelated(d.related_recipes ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-[16/9] animate-pulse rounded-[22px] bg-muted" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-[18px] bg-muted" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-foreground-secondary">{error ?? "找不到食譜"}</p>
        <Link href="/recipes" className="text-sm text-primary hover:underline">
          返回食譜列表
        </Link>
      </div>
    );
  }

  const computed = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);
  const total = recipe.total_time ?? (computed > 0 ? computed : null);
  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/recipes/${recipe.slug}`;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <div className="overflow-hidden rounded-[22px] border border-border-soft bg-peach-soft/40">
        <div className="flex min-h-[180px] items-end bg-gradient-to-br from-cream via-peach-soft to-butter-soft p-6">
          <div>
            <p className="text-xs font-medium text-caramel">
              {recipe.recipe_categories?.name ?? "食譜"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-caramel md:text-3xl">{recipe.title}</h1>
          </div>
        </div>
      </div>

      {recipe.summary && (
        <p className="text-base text-foreground-secondary">{recipe.summary}</p>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-peach-soft px-3 py-1 text-caramel">
          {DIFFICULTY[recipe.difficulty] ?? recipe.difficulty}
        </span>
        {total != null && total > 0 && (
          <span className="rounded-full bg-butter-soft px-3 py-1 text-caramel">約 {total} 分鐘</span>
        )}
        {recipe.servings && (
          <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">
            {recipe.servings}
          </span>
        )}
        {recipe.published_at && (
          <span className="rounded-full bg-surface px-3 py-1 text-foreground-secondary border border-border-soft">
            {formatDate(recipe.published_at)}
          </span>
        )}
      </div>

      {recipe.content && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-caramel">簡介</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{recipe.content}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-caramel">材料清單</h2>
        <IngredientList ingredients={recipe.recipe_ingredients ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-caramel">製作步驟</h2>
        <RecipeStepList steps={recipe.recipe_steps ?? []} />
      </section>

      {recipe.tips && (
        <section className="rounded-[18px] bg-butter-soft/50 p-4">
          <h2 className="font-semibold text-caramel">製作重點</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{recipe.tips}</p>
        </section>
      )}

      {recipe.storage_method && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-caramel">保存方式</h2>
          <p className="text-sm text-foreground">{recipe.storage_method}</p>
        </section>
      )}

      {recipe.videos?.video_url && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-caramel">教學影音</h2>
          <VideoEmbed url={recipe.videos.video_url} title={recipe.videos.title} />
          {recipe.videos.slug || recipe.videos.id ? (
            <Link
              href={`/videos/${recipe.videos.slug ?? recipe.videos.id}`}
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              前往影音頁 →
            </Link>
          ) : null}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-2xl border border-border-soft bg-surface px-4 text-sm font-medium text-caramel"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: recipe.title, url: shareUrl }).catch(() => {});
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(shareUrl);
              alert("已複製連結");
            }
          }}
        >
          分享食譜
        </button>
        <FavoriteButton targetType="recipe" targetId={recipe.id} className="!h-11 !w-11 !rounded-2xl" />
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-caramel">相關食譜</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/recipes/${r.slug}`} className="text-sm font-medium text-primary hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
