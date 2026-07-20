"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  preorder_stock: number;
  safety_stock: number;
  min_stock_alert: number;
  inventory_mode: string;
  expected_arrival_date: string | null;
  brand_name: string | null;
  category_name: string | null;
};

const filters = [
  { value: "all", label: "全部" },
  { value: "low", label: "低庫存" },
  { value: "out", label: "缺貨" },
  { value: "preorder", label: "預購庫存" },
  { value: "arriving", label: "即將到貨" },
];

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ filter });
    if (search) params.set("search", search);
    fetch(`/api/admin/inventory?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [search, filter]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="庫存報表"
        description="現貨、預購、安全庫存與低庫存警示"
        actions={
          <Link href="/admin/products">
            <Button variant="outline">返回商品管理</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === f.value
                ? "bg-[#FF4F7B] text-white"
                : "bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#FF4F7B]/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminTable
        columns={[
          { key: "name", header: "商品", render: (p) => p.name },
          { key: "sku", header: "SKU", render: (p) => p.sku ?? "—" },
          { key: "brand", header: "品牌", render: (p) => p.brand_name ?? "—" },
          { key: "category", header: "分類", render: (p) => p.category_name ?? "—" },
          { key: "stock", header: "現貨", render: (p) => p.stock },
          { key: "preorder", header: "預購", render: (p) => p.preorder_stock ?? 0 },
          { key: "safety", header: "安全庫存", render: (p) => p.safety_stock ?? 0 },
          {
            key: "status",
            header: "狀態",
            render: (p) => {
              if (p.stock <= 0) return <StatusBadge label="缺貨" variant="secondary" />;
              if (p.stock <= (p.min_stock_alert ?? 5)) {
                return <StatusBadge label="低庫存" variant="primary" />;
              }
              return <StatusBadge label="正常" variant="success" />;
            },
          },
          {
            key: "arrival",
            header: "預計到貨",
            render: (p) => p.expected_arrival_date?.slice(0, 10) ?? "—",
          },
          {
            key: "actions",
            header: "操作",
            render: (p) => (
              <Link href={`/admin/products/${p.id}/edit`}>
                <Button size="sm" variant="secondary">編輯</Button>
              </Link>
            ),
          },
        ]}
        rows={items}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋商品、品牌、分類…"
        loading={loading}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
      />
    </div>
  );
}
