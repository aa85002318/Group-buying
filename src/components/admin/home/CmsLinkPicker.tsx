"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";
import { APP_ROUTES, canonicalizeAppHref } from "@/lib/site-links";

export type CmsLinkType =
  | "none"
  | "internal"
  | "product"
  | "category"
  | "recipe"
  | "article"
  | "group_buy"
  | "live"
  | "member"
  | "custom";

export type CmsLinkValue = {
  type: CmsLinkType;
  /** Resolved href for front-end fallback */
  href: string;
  /** Content id when type is entity-based */
  refId?: string | null;
  label?: string | null;
  openInNewTab?: boolean;
};

const LINK_TYPES: Array<{ id: CmsLinkType; label: string }> = [
  { id: "none", label: "無連結" },
  { id: "internal", label: "站內頁面" },
  { id: "product", label: "商品" },
  { id: "category", label: "商品分類" },
  { id: "recipe", label: "食譜" },
  { id: "article", label: "文章" },
  ...(FEATURES.groupBuying ? [{ id: "group_buy" as const, label: "團購活動" }] : []),
  { id: "live", label: "直播" },
  { id: "member", label: "會員頁面" },
  { id: "custom", label: "自訂網址" },
];

const INTERNAL_PAGES = [
  { id: "home", label: "首頁", href: APP_ROUTES.home },
  { id: "shop", label: "商城", href: APP_ROUTES.shop },
  ...(FEATURES.groupBuying ? [{ id: "group-buy", label: "團購", href: "/group-buy" }] : []),
  { id: "recipes", label: "食譜", href: APP_ROUTES.recipes },
  { id: "articles", label: "文章中心", href: "/articles" },
  {
    id: "promo",
    label: "優惠活動（文章）",
    href: "/articles?category=%E5%84%AA%E6%83%A0%E6%B4%BB%E5%8B%95",
  },
  {
    id: "news",
    label: "最新消息（文章）",
    href: "/articles?category=%E6%9C%80%E6%96%B0%E6%B6%88%E6%81%AF",
  },
  { id: "live", label: "直播", href: "/live" },
  { id: "stores", label: "門市", href: APP_ROUTES.stores },
  { id: "member", label: "會員中心", href: APP_ROUTES.member },
  { id: "support", label: "客服", href: APP_ROUTES.support },
  { id: "ai", label: "AI 助手", href: APP_ROUTES.ai },
];

type SearchHit = {
  id: string;
  title: string;
  href: string;
  thumb?: string | null;
  status?: string | null;
};

function emptyLink(): CmsLinkValue {
  return { type: "none", href: "", refId: null, label: null, openInNewTab: false };
}

/**
 * Unified CMS link picker — search entities instead of pasting URLs when possible.
 */
export function CmsLinkPicker({
  value,
  onChange,
  className,
}: {
  value?: CmsLinkValue | null;
  onChange: (next: CmsLinkValue) => void;
  className?: string;
}) {
  const current = value ?? emptyLink();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const needsSearch = ["product", "category", "recipe", "article", "group_buy", "live"].includes(
    current.type
  );

  useEffect(() => {
    if (!needsSearch) {
      setHits([]);
      return;
    }
    const needle = q.trim();
    if (needle.length < 1 && current.type !== "category") {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const next = await searchByType(current.type, needle);
        if (!cancelled) setHits(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, current.type, needsSearch]);

  const typeLabel = useMemo(
    () => LINK_TYPES.find((t) => t.id === current.type)?.label ?? "",
    [current.type]
  );

  return (
    <div className={cn("space-y-2 rounded-xl border border-border bg-white p-3", className)}>
      <p className="text-xs font-medium text-muted-foreground">指定連結</p>
      <select
        className="input-field w-full"
        value={current.type}
        onChange={(e) => {
          const type = e.target.value as CmsLinkType;
          if (type === "none") onChange(emptyLink());
          else if (type === "member")
            onChange({ type, href: "/member", refId: "member", label: "會員中心" });
          else onChange({ type, href: "", refId: null, label: null, openInNewTab: false });
          setQ("");
        }}
      >
        {LINK_TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>

      {current.type === "internal" ? (
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {INTERNAL_PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-soft",
                current.refId === p.id && "bg-surface-yellow"
              )}
              onClick={() =>
                onChange({ type: "internal", href: p.href, refId: p.id, label: p.label })
              }
            >
              <span>{p.label}</span>
              <span className="text-[11px] text-muted-foreground">{p.href}</span>
            </button>
          ))}
        </div>
      ) : null}

      {needsSearch ? (
        <>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`搜尋${typeLabel}…`}
          />
          {loading ? <p className="text-[11px] text-muted-foreground">搜尋中…</p> : null}
          <ul className="max-h-44 space-y-1 overflow-y-auto">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-soft",
                    current.refId === h.id && "bg-surface-yellow"
                  )}
                  onClick={() =>
                    onChange({
                      type: current.type,
                      href: h.href,
                      refId: h.id,
                      label: h.title,
                    })
                  }
                >
                  {h.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.thumb} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-surface-soft text-[10px]">
                      —
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{h.title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {h.href}
                      {h.status ? ` · ${h.status}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {current.type === "custom" ? (
        <div className="space-y-2">
          <Input
            value={current.href}
            onChange={(e) => onChange({ ...current, href: canonicalizeAppHref(e.target.value) })}
            placeholder="https:// 或 /path"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(current.openInNewTab)}
              onChange={(e) => onChange({ ...current, openInNewTab: e.target.checked })}
            />
            另開視窗
          </label>
        </div>
      ) : null}

      {current.href ? (
        <p className="truncate text-[11px] text-muted-foreground">
          目前：{current.label ? `${current.label} → ` : ""}
          {current.href}
        </p>
      ) : null}
    </div>
  );
}

async function searchByType(type: CmsLinkType, q: string): Promise<SearchHit[]> {
  try {
    if (type === "product") {
      const r = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      return ((d.products ?? []) as Array<Record<string, unknown>>)
        .slice(0, 20)
        .map((p) => ({
          id: String(p.id),
          title: String(p.name ?? "商品"),
          href: `/shop/products/${p.slug || p.id}`,
          thumb: (p.image_url as string) ?? null,
          status: p.is_active === false ? "下架" : "上架",
        }));
    }
    if (type === "category") {
      const r = await fetch("/api/product-categories");
      const d = await r.json();
      const list = ((d.categories ?? []) as Array<Record<string, unknown>>).map((c) => ({
        id: String(c.id),
        title: String(c.name ?? "分類"),
        href: `/shop/category/${c.slug || c.id}`,
        thumb: null,
        status: null,
      }));
      const needle = q.trim().toLowerCase();
      return needle
        ? list.filter((c) => c.title.toLowerCase().includes(needle)).slice(0, 20)
        : list.slice(0, 20);
    }
    if (type === "recipe") {
      const r = await fetch("/api/recipes");
      const d = await r.json();
      const needle = q.trim().toLowerCase();
      return ((d.recipes ?? []) as Array<Record<string, unknown>>)
        .filter((x) => String(x.title ?? "").toLowerCase().includes(needle))
        .slice(0, 20)
        .map((x) => ({
          id: String(x.id),
          title: String(x.title ?? "食譜"),
          href: `/recipes/${x.slug || x.id}`,
          thumb: (x.cover_image as string) ?? null,
          status: x.is_published === false ? "草稿" : "已發布",
        }));
    }
    if (type === "article") {
      const r = await fetch("/api/articles");
      const d = await r.json();
      const needle = q.trim().toLowerCase();
      return ((d.articles ?? []) as Array<Record<string, unknown>>)
        .filter((x) => String(x.title ?? "").toLowerCase().includes(needle))
        .slice(0, 20)
        .map((x) => ({
          id: String(x.id),
          title: String(x.title ?? "文章"),
          href: `/articles/${x.slug || x.id}`,
          thumb: (x.cover_image as string) ?? null,
          status: x.is_published === false ? "草稿" : "已發布",
        }));
    }
    if (type === "group_buy") {
      const r = await fetch("/api/group-buy-events");
      const d = await r.json();
      const needle = q.trim().toLowerCase();
      return ((d.events ?? []) as Array<Record<string, unknown>>)
        .filter((x) => String(x.title ?? "").toLowerCase().includes(needle))
        .slice(0, 20)
        .map((x) => ({
          id: String(x.id),
          title: String(x.title ?? "團購"),
          href: `/group-buy/${x.slug || x.id}`,
          thumb: (x.cover_image as string) ?? null,
          status: String(x.status ?? ""),
        }));
    }
    if (type === "live") {
      const r = await fetch("/api/livestreams");
      const d = await r.json();
      const needle = q.trim().toLowerCase();
      return ((d.livestreams ?? []) as Array<Record<string, unknown>>)
        .filter((x) => String(x.title ?? "").toLowerCase().includes(needle))
        .slice(0, 20)
        .map((x) => ({
          id: String(x.id),
          title: String(x.title ?? "直播"),
          href: `/live/${x.slug || x.id}`,
          thumb: (x.cover_image as string) ?? null,
          status: String(x.status ?? ""),
        }));
    }
  } catch {
    return [];
  }
  return [];
}

export function hrefFromCmsLink(link?: CmsLinkValue | null): string {
  if (!link || link.type === "none") return "";
  return link.href || "";
}

export function cmsLinkFromHref(href?: string | null): CmsLinkValue {
  const h = canonicalizeAppHref((href ?? "").trim());
  if (!h) return emptyLink();
  const internal = INTERNAL_PAGES.find((p) => p.href === h);
  if (internal)
    return { type: "internal", href: internal.href, refId: internal.id, label: internal.label };
  if (h === "/member") return { type: "member", href: "/member", refId: "member", label: "會員中心" };
  return { type: "custom", href: h, openInNewTab: /^https?:\/\//i.test(h) };
}
