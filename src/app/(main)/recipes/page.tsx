import type { Metadata } from "next";
import Link from "next/link";
import { RecipeCard } from "@/components/consumer/RecipeCard";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { MOCK_RECIPES, MOCK_VIDEOS } from "@/lib/mock/consumer-hub";

export const metadata: Metadata = {
  title: "CHIMEIDIY 食譜影音｜烘焙食譜與教學影片",
  description: "最新食譜、一分鐘教學、熱門影音與直播回放入口。",
};

export default function RecipesPage() {
  return (
    <div className="space-y-8 page-enter">
      <header>
        <p className="text-xs font-bold text-foreground">食譜／影音</p>
        <h1 className="mt-1 text-2xl font-black text-foreground">食譜影音中心</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          第一階段提供入口骨架與預留「缺少材料一鍵購買」欄位；完整串接後續開放。
        </p>
      </header>

      <section>
        <SectionHeader title="最新食譜" href="/articles" accentClass="bg-warning" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_RECIPES.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="一分鐘教你做" href="/videos" accentClass="bg-error" />
        <div className="grid gap-3 sm:grid-cols-2">
          {MOCK_VIDEOS.map((v) => (
            <Link key={v.id} href={v.href} className="card-lift p-4">
              <p className="text-xs font-bold text-error">短影音 · {v.durationLabel}</p>
              <h3 className="mt-1 font-black text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm font-bold text-primary">觀看 →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "熱門影音", href: "/videos" },
          { title: "直播回放", href: "/live" },
          { title: "烘焙知識", href: "/articles" },
          { title: "老師推薦", href: "/courses" },
          { title: "收藏食譜", href: "/member/favorites" },
        ].map((b) => (
          <Link key={b.href + b.title} href={b.href} className="card-surface p-4 hover:bg-surface-soft">
            <h3 className="font-black text-foreground">{b.title}</h3>
            <p className="mt-1 text-sm text-foreground-secondary">進入現有內容區</p>
          </Link>
        ))}
      </section>

      <div className="card-surface border-dashed p-4 text-sm text-foreground-secondary">
        預留：食譜詳情「缺少材料一鍵加入購物車」— 資料欄位已於 TypeScript `RecipeSummary` 預留擴充。
      </div>
    </div>
  );
}
