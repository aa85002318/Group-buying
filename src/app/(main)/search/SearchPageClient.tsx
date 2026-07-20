"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HomeSearchBar } from "@/components/consumer/HomeSearchBar";
import { StoreLocationResult } from "@/components/consumer/StoreLocationResult";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { searchProductLocations } from "@/lib/mock/consumer-hub";

type Hit = {
  type: string;
  id: string;
  title: string;
  href: string;
  snippet?: string | null;
};

export function SearchPageClient() {
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const [results, setResults] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const locations = useMemo(() => (q ? searchProductLocations(q) : []), [q]);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>();
    for (const hit of results) {
      const list = map.get(hit.type) ?? [];
      list.push(hit);
      map.set(hit.type, list);
    }
    return map;
  }, [results]);

  const typeLabel: Record<string, string> = {
    product: "商品",
    article: "食譜／文章",
    course: "課程",
    livestream: "直播",
    faq: "FAQ",
    brand: "品牌",
  };

  return (
    <div className="space-y-6 page-enter">
      <header className="space-y-3">
        <h1 className="text-2xl font-black text-foreground">全站搜尋</h1>
        <HomeSearchBar />
        {q && (
          <p className="text-sm text-foreground-secondary">
            關鍵字：<span className="font-bold text-foreground">{q}</span>
          </p>
        )}
      </header>

      {!q && (
        <div className="card-surface p-6 text-center text-sm text-foreground-secondary">
          輸入至少 2 個字元開始搜尋商品、文章、課程、FAQ 等。
        </div>
      )}

      {loading && <p className="text-sm text-foreground-secondary">搜尋中…</p>}

      {q && !loading && results.length === 0 && locations.length === 0 && (
        <div className="card-surface p-6 text-center">
          <p className="font-bold text-foreground">沒有符合的結果</p>
          <p className="mt-1 text-sm text-foreground-secondary">試試其他關鍵字，或從八大入口瀏覽。</p>
        </div>
      )}

      {Array.from(grouped.entries()).map(([type, hits]: [string, Hit[]]) => (
        <section key={type}>
          <SectionHeader title={typeLabel[type] ?? type} />
          <ul className="space-y-2">
            {hits.map((hit: Hit) => (
              <li key={`${hit.type}-${hit.id}`}>
                <Link href={hit.href} className="card-surface block p-4 hover:bg-surface-soft">
                  <p className="font-bold text-foreground">{hit.title}</p>
                  {hit.snippet && (
                    <p className="mt-1 line-clamp-2 text-sm text-foreground-secondary">
                      {hit.snippet}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {locations.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="門市商品位置" href="/store-map" accentClass="bg-success" />
          {locations.map((item) => (
            <StoreLocationResult key={item.productId} item={item} />
          ))}
        </section>
      )}
    </div>
  );
}
