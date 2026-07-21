"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/member/FavoriteButton";
import {
  BROWSE_TYPE_LABEL,
  readBrowseHistory,
  type BrowseHistoryItem,
  type BrowseItemType,
} from "@/lib/home/browse-history";
import { APP_ROUTES } from "@/lib/site-links";
import { formatCurrency } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/config";

function favoriteProps(type: BrowseItemType, id: string) {
  if (type === "product") return { targetType: "product" as const, targetId: id };
  if (type === "recipe") return { targetType: "recipe" as const, targetId: id };
  return null;
}

export default function MemberRecentPage() {
  const [auth, setAuth] = useState<"loading" | "guest" | "member">("loading");
  const [items, setItems] = useState<BrowseHistoryItem[]>([]);

  const refresh = useCallback(() => {
    setItems(readBrowseHistory());
  }, []);

  useEffect(() => {
    refresh();
    if (!isSupabaseConfigured()) {
      setAuth("guest");
      return;
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setAuth(d.profile ? "member" : "guest"))
      .catch(() => setAuth("guest"));
  }, [refresh]);

  if (auth === "loading") {
    return <p className="p-4 text-sm text-foreground-secondary">載入中…</p>;
  }

  if (auth === "guest") {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4 text-center">
        <h1 className="text-xl font-bold text-caramel">最近瀏覽</h1>
        <p className="text-sm text-foreground-secondary">登入後可同步查看你感興趣的內容。</p>
        <Link
          href={`/auth/login?redirect=${encodeURIComponent("/member/recent")}`}
          className="inline-flex h-11 items-center rounded-button bg-primary px-5 text-sm font-bold text-white"
        >
          登入
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-4 p-4 pb-[calc(var(--bottom-nav-height)+1.5rem)] md:pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-caramel">最近瀏覽</h1>
          <p className="text-sm text-foreground-secondary">最多保留 10 筆本機紀錄</p>
        </div>
        <Link href={APP_ROUTES.member ?? "/member"} className="text-sm font-semibold text-primary">
          回會員中心
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-border-soft bg-surface-soft p-8 text-center">
          <p className="font-semibold text-caramel">還沒有瀏覽紀錄</p>
          <p className="mt-1 text-sm text-foreground-secondary">去逛逛熱門商品吧！</p>
          <Link
            href="/products"
            className="mt-4 inline-flex h-11 items-center rounded-button bg-primary px-5 text-sm font-bold text-white"
          >
            逛商品
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const fav = favoriteProps(item.type, item.id);
            return (
              <li
                key={`${item.type}-${item.id}`}
                className="overflow-hidden rounded-[18px] border border-border-soft bg-surface shadow-card"
              >
                <Link href={item.href} className="flex gap-3 p-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-surface-soft">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-caramel">
                      {BROWSE_TYPE_LABEL[item.type]}
                    </span>
                    <p className="line-clamp-2 font-semibold text-foreground">{item.title}</p>
                    {item.price != null ? (
                      <p className="text-sm font-bold text-caramel">
                        {formatCurrency(Number(item.price))}
                      </p>
                    ) : null}
                  </div>
                </Link>
                <div className="flex items-center justify-between border-t border-border-soft px-3 py-2">
                  {fav ? <FavoriteButton {...fav} size="sm" /> : <span />}
                  <Link href={item.href} className="text-xs font-bold text-primary">
                    再次查看
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
