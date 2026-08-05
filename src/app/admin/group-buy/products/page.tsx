"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackagePlus, ShoppingBag } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAdminList } from "@/hooks/useAdminList";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

type GroupBuyPeriodTab = "all" | "active" | "upcoming" | "ended" | "monthly";

type GroupBuyProduct = Product & {
  is_group_buy?: boolean;
  group_buy_start_at?: string | null;
  group_buy_end_at?: string | null;
  is_monthly_group_buy?: boolean;
  is_limited_product?: boolean;
  group_buy_categories?: { name?: string } | null;
  sku?: string;
};

const PERIOD_TABS: { id: GroupBuyPeriodTab; label: string }[] = [
  { id: "all", label: "全部團購" },
  { id: "active", label: "進行中" },
  { id: "upcoming", label: "即將開團" },
  { id: "ended", label: "已結束" },
  { id: "monthly", label: "本月團購" },
];

function periodOf(p: GroupBuyProduct, now = Date.now()): Exclude<GroupBuyPeriodTab, "all" | "monthly"> {
  const start = p.group_buy_start_at ? new Date(p.group_buy_start_at).getTime() : NaN;
  const end = p.group_buy_end_at ? new Date(p.group_buy_end_at).getTime() : NaN;
  if (Number.isFinite(start) && now < start) return "upcoming";
  if (Number.isFinite(end) && now > end) return "ended";
  return "active";
}

function formatRange(start?: string | null, end?: string | null) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("zh-TW", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  if (!start && !end) return "—";
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (start) return `${fmt(start)} 起`;
  return `至 ${fmt(end!)}`;
}

export default function AdminGroupBuyProductsPage() {
  const { search, setSearch, page, setPage, loading, filtered, items } =
    useAdminList<GroupBuyProduct>("/api/admin/products", "products", ["name", "sku"]);
  const [period, setPeriod] = useState<GroupBuyPeriodTab>("all");

  const groupBuyItems = useMemo(
    () => items.filter((p) => Boolean(p.is_group_buy)),
    [items]
  );

  const periodCounts = useMemo(() => {
    const now = Date.now();
    const counts: Record<GroupBuyPeriodTab, number> = {
      all: groupBuyItems.length,
      active: 0,
      upcoming: 0,
      ended: 0,
      monthly: 0,
    };
    for (const p of groupBuyItems) {
      counts[periodOf(p, now)] += 1;
      if (p.is_monthly_group_buy) counts.monthly += 1;
    }
    return counts;
  }, [groupBuyItems]);

  const visible = useMemo(() => {
    const now = Date.now();
    const base = filtered.filter((p) => Boolean(p.is_group_buy));
    if (period === "all") return base;
    if (period === "monthly") return base.filter((p) => p.is_monthly_group_buy);
    return base.filter((p) => periodOf(p, now) === period);
  }, [filtered, period]);

  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pages);
  const rows = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="團購商品"
        description="以團購商品為主，依團購區間檢視與管理。仍使用共用商品主檔，不上第二套商品庫。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products/new">
              <Button variant="secondary">
                <PackagePlus className="mr-1.5 h-4 w-4" />
                商品新增
              </Button>
            </Link>
            <Link href="/admin/products/new?mode=group-buy">
              <Button className="bg-primary hover:bg-[#E63D6A]">
                <ShoppingBag className="mr-1.5 h-4 w-4" />
                團購新增
              </Button>
            </Link>
          </div>
        }
      />

      <div>
        <p className="mb-2 text-sm font-semibold text-[#334155]">團購區間</p>
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="團購區間"
        >
          {PERIOD_TABS.map((tab) => {
            const selected = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setPeriod(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold whitespace-nowrap border",
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground"
                )}
              >
                {tab.label}
                <span className={cn("text-xs", selected ? "text-white/90" : "text-foreground-muted")}>
                  {periodCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AdminTable
        columns={[
          {
            key: "name",
            header: "團購商品",
            render: (p) => (
              <div>
                <p className="font-semibold text-foreground">{p.name}</p>
                {p.sku ? <p className="text-xs text-foreground-muted">{p.sku}</p> : null}
              </div>
            ),
          },
          {
            key: "period",
            header: "團購區間",
            render: (p) => (
              <div>
                <p className="text-sm text-foreground">{formatRange(p.group_buy_start_at, p.group_buy_end_at)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <StatusBadge
                    label={
                      periodOf(p) === "active"
                        ? "進行中"
                        : periodOf(p) === "upcoming"
                          ? "即將開團"
                          : "已結束"
                    }
                    variant={periodOf(p) === "active" ? "success" : "secondary"}
                  />
                  {p.is_monthly_group_buy ? (
                    <StatusBadge label="本月團購" variant="primary" />
                  ) : null}
                  {p.is_limited_product ? (
                    <StatusBadge label="限定" variant="secondary" />
                  ) : null}
                </div>
              </div>
            ),
          },
          {
            key: "gb_category",
            header: "團購分類",
            render: (p) => p.group_buy_categories?.name ?? "—",
          },
          {
            key: "price",
            header: "售價",
            render: (p) => formatCurrency(p.price),
          },
          { key: "stock", header: "庫存", render: (p) => p.stock },
          {
            key: "actions",
            header: "操作",
            render: (p) => (
              <Link href={`/admin/products/${p.id}/edit`}>
                <Button size="sm" variant="secondary">
                  編輯
                </Button>
              </Link>
            ),
          },
        ]}
        rows={rows}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="搜尋團購商品名稱、SKU…"
        loading={loading}
        page={safePage}
        totalPages={pages}
        onPageChange={setPage}
        emptyText={
          loading
            ? undefined
            : period === "all"
              ? "尚無團購商品，請使用「團購新增」建立。"
              : "此團購區間目前沒有商品。"
        }
      />
    </div>
  );
}
