import Link from "next/link";
import Image from "next/image";
import { Clock3 } from "lucide-react";
import type { Article } from "@/lib/types/database";

function readingMinutes(content: string | null | undefined) {
  const chars = (content ?? "").replace(/<[^>]+>/g, "").length;
  return Math.max(1, Math.ceil(chars / 400));
}

export function ArticleHomeSection({ articles }: { articles: Article[] }) {
  const items = articles.filter((a) => a.status === "published").slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-1.5 rounded-full bg-success" />
          <h2 className="section-title">食譜文章</h2>
        </div>
        <Link href="/articles" className="text-sm font-bold text-primary">
          查看更多
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((a) => (
          <Link key={a.id} href={`/articles/${a.slug}`} className="card-lift flex gap-3 overflow-hidden p-3">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
              {a.cover_image ? (
                <Image src={a.cover_image} alt={a.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-foreground-secondary">
                  封面
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {a.product_categories?.name && (
                <span className="text-[10px] font-bold text-success">{a.product_categories.name}</span>
              )}
              <h3 className="mt-0.5 line-clamp-2 text-sm font-bold text-foreground">{a.title}</h3>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-foreground-secondary">
                <Clock3 className="h-3.5 w-3.5" />
                約 {readingMinutes(a.content)} 分鐘
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
