"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  SideMenuEmptyState,
  SideMenuSkeleton,
} from "@/components/navigation/side-menu/SideMenuEmptyState";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { APP_ROUTES } from "@/lib/site-links";
import { formatCurrency } from "@/lib/utils";

export function SideMenuSearchPanel({
  query,
  onQueryChange,
  recentSearches,
  onPushSearch,
  onRemoveSearch,
  onClearSearches,
  onNavigate,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  recentSearches: string[];
  onPushSearch: (q: string) => void;
  onRemoveSearch: (q: string) => void;
  onClearSearches: () => void;
  onNavigate: () => void;
}) {
  const { data, loading, error, loadMore } = useGlobalSearch(query, true);
  const hasQuery = query.trim().length >= 2;
  const emptyResults =
    hasQuery &&
    !loading &&
    !error &&
    data.products.length === 0 &&
    data.categories.length === 0 &&
    data.recipes.length === 0 &&
    data.brands.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 py-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim().length >= 2) {
                onPushSearch(query);
              }
            }}
            placeholder="搜尋商品、分類、品牌或食譜"
            className="h-12 w-full rounded-2xl border border-[#E8E1D7] bg-[#FFFEFA] pl-10 pr-10 text-sm text-[#153E73] outline-none focus:border-[#FFD454]"
            aria-label="搜尋"
            autoFocus
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#687386]"
              aria-label="清除搜尋"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        {!hasQuery ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#153E73]">最近搜尋</h3>
              {recentSearches.length ? (
                <button
                  type="button"
                  onClick={onClearSearches}
                  className="text-xs font-semibold text-[#79C7E8]"
                >
                  清除全部
                </button>
              ) : null}
            </div>
            {recentSearches.length === 0 ? (
              <p className="text-sm text-[#687386]">尚無搜尋紀錄</p>
            ) : (
              <ul className="space-y-1">
                {recentSearches.map((term) => (
                  <li key={term} className="flex items-center gap-2">
                    <button
                      type="button"
                      className="min-h-10 flex-1 rounded-xl px-2 text-left text-sm font-medium text-[#153E73] hover:bg-[#FFF5CC]"
                      onClick={() => onQueryChange(term)}
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      aria-label={`刪除 ${term}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#687386]"
                      onClick={() => onRemoveSearch(term)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {loading && hasQuery ? <SideMenuSkeleton rows={5} /> : null}
        {error ? <SideMenuEmptyState message={error} /> : null}
        {emptyResults ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-sm text-[#687386]">找不到符合的內容</p>
            <div className="flex flex-col gap-2">
              <Link
                href={APP_ROUTES.shopCategories}
                onClick={onNavigate}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#FFD454] text-sm font-bold text-[#153E73]"
              >
                查看全部分類
              </Link>
              <Link
                href="/ai-tools"
                onClick={onNavigate}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#E8E1D7] text-sm font-bold text-[#153E73]"
              >
                使用 AI 找食譜
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && hasQuery && !emptyResults ? (
          <div className="space-y-5">
            <ResultGroup
              title="商品"
              seeAllHref={`/shop/search?q=${encodeURIComponent(query)}`}
              onNavigate={() => {
                onPushSearch(query);
                onNavigate();
              }}
            >
              {data.products.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={p.href}
                  onClick={() => {
                    onPushSearch(query);
                    onNavigate();
                  }}
                  className="flex gap-3 py-2"
                >
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#FFFEFA]">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#153E73]">
                      {p.name}
                    </span>
                    <span className="block text-xs text-[#687386]">
                      {[p.sku, p.categoryName].filter(Boolean).join(" · ")}
                    </span>
                    {p.price != null ? (
                      <span className="block text-sm font-bold text-[#153E73]">
                        {formatCurrency(p.price)}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </ResultGroup>

            <ResultGroup
              title="分類"
              seeAllHref={APP_ROUTES.shopCategories}
              onNavigate={onNavigate}
            >
              {data.categories.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={c.href}
                  onClick={onNavigate}
                  className="block py-2"
                >
                  <span className="block text-sm font-semibold text-[#153E73]">{c.name}</span>
                  <span className="block text-xs text-[#687386]">
                    {[c.parentName, c.level != null ? `第 ${c.level} 層` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
              ))}
            </ResultGroup>

            <ResultGroup title="食譜" seeAllHref="/recipes" onNavigate={onNavigate}>
              {data.recipes.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={r.href}
                  onClick={onNavigate}
                  className="flex gap-3 py-2"
                >
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#FFFEFA]">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#153E73]">
                      {r.name}
                    </span>
                    {r.categoryName ? (
                      <span className="block text-xs text-[#687386]">{r.categoryName}</span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </ResultGroup>

            <ResultGroup title="品牌" seeAllHref={APP_ROUTES.shop} onNavigate={onNavigate}>
              {data.brands.slice(0, 5).map((b) => (
                <Link
                  key={b.id}
                  href={b.href}
                  onClick={onNavigate}
                  className="block py-2 text-sm font-semibold text-[#153E73]"
                >
                  {b.name}
                </Link>
              ))}
            </ResultGroup>

            {data.hasMore ? (
              <button
                type="button"
                onClick={loadMore}
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-[#E8E1D7] text-sm font-bold text-[#153E73]"
              >
                繼續載入
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ResultGroup({
  title,
  children,
  seeAllHref,
  onNavigate,
}: {
  title: string;
  children: React.ReactNode;
  seeAllHref: string;
  onNavigate: () => void;
}) {
  const childArray = Array.isArray(children) ? children : [children];
  if (!childArray.filter(Boolean).length) return null;
  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#153E73]">{title}</h3>
        <Link
          href={seeAllHref}
          onClick={onNavigate}
          className="text-xs font-semibold text-[#79C7E8]"
        >
          查看全部結果
        </Link>
      </div>
      <div className="divide-y divide-[#F0ECE5]">{children}</div>
    </section>
  );
}
