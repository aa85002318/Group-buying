import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/env";
import { APP_ROUTES } from "@/lib/site-links";

export const metadata: Metadata = {
  title: `商品分類｜${BRAND_NAME}`,
};

const CATEGORIES = [
  { href: "/products?category=廚房用品", label: "廚房用品", emoji: "🍳" },
  { href: "/products?category=居家清潔", label: "居家清潔", emoji: "✨" },
  { href: "/products?category=食品", label: "食品", emoji: "🍪" },
  { href: "/products?category=生鮮食材", label: "生鮮食材", emoji: "🥬" },
  { href: "/products?category=冷凍食品", label: "冷凍食品", emoji: "🧊" },
  { href: "/products?category=季節限定", label: "季節限定", emoji: "🌸" },
  { href: APP_ROUTES.products, label: "全部商品", emoji: "🛍️" },
  { href: "/group-buy", label: "熱門團購", emoji: "🔥" },
] as const;

export default function CategoriesPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">商品分類</h1>
        <p className="text-sm text-muted-foreground">挑選你感興趣的團購分類</p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {CATEGORIES.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card-surface flex flex-col items-center gap-2 p-5 text-center transition hover:border-primary/30 hover:shadow-brand active:scale-[0.98]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blush text-2xl">
              {item.emoji}
            </span>
            <span className="text-sm font-semibold text-foreground">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
