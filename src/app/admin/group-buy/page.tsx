"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { groupBuyStatusVariant } from "@/lib/admin/status";
import { formatDate, GROUP_BUY_STATUS_LABELS } from "@/lib/utils";
import type { GroupBuyEvent, Product } from "@/lib/types/database";

const emptyForm = {
  title: "",
  short_title: "",
  description: "",
  start_at: "",
  end_at: "",
  status: "draft",
  banner_url: "",
  is_homepage_featured: false,
  homepage_sort_order: 0,
  linked_product_id: "",
  is_featured: false,
  sort_order: 0,
  original_price: "",
  group_price: "",
  threshold_type: "none",
  threshold_value: "",
  show_progress: false,
  fulfillment_options: [] as string[],
  manual_tags: "",
  category_label: "",
  expected_arrival_at: "",
};

export default function AdminGroupBuyPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<GroupBuyEvent>(
    "/api/admin/group-buy-events",
    "events",
    ["title"]
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GroupBuyEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (e: GroupBuyEvent) => {
    setEditing(e);
    setForm({
      title: e.title,
      short_title: e.short_title ?? "",
      description: e.description ?? "",
      start_at: e.start_at ? e.start_at.slice(0, 16) : "",
      end_at: e.end_at ? e.end_at.slice(0, 16) : "",
      status: e.status,
      banner_url: e.banner_url ?? "",
      is_homepage_featured: e.is_homepage_featured ?? false,
      homepage_sort_order: e.homepage_sort_order ?? 0,
      linked_product_id: e.linked_product_id ?? "",
      is_featured: e.is_featured ?? false,
      sort_order: e.sort_order ?? 0,
      original_price: e.original_price != null ? String(e.original_price) : "",
      group_price: e.group_price != null ? String(e.group_price) : "",
      threshold_type: e.threshold_type ?? "none",
      threshold_value: e.threshold_value != null ? String(e.threshold_value) : "",
      show_progress: e.show_progress ?? false,
      fulfillment_options: Array.isArray(e.fulfillment_options) && e.fulfillment_options.length
        ? e.fulfillment_options
        : ["store_pickup"],
      manual_tags: (e.manual_tags ?? []).join(","),
      category_label: e.category_label ?? "",
      expected_arrival_at: e.expected_arrival_at ? e.expected_arrival_at.slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (form.start_at && form.end_at && new Date(form.start_at) >= new Date(form.end_at)) {
        alert("開始時間必須早於結團時間");
        return;
      }
      if (
        form.expected_arrival_at &&
        form.end_at &&
        new Date(form.end_at) > new Date(form.expected_arrival_at)
      ) {
        alert("結團時間必須早於或等於預計到貨時間");
        return;
      }
      if (!form.fulfillment_options.length) {
        alert("請至少選擇一種取貨／配送方式");
        return;
      }

      const tags = form.manual_tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 2);

      const payload = {
        title: form.title,
        short_title: form.short_title || null,
        description: form.description,
        start_at: form.start_at || new Date().toISOString(),
        end_at: form.end_at || new Date(Date.now() + 7 * 86400000).toISOString(),
        status: form.status,
        banner_url: form.banner_url || null,
        banner_aspect_ratio: "16:9",
        is_homepage_featured: form.is_homepage_featured,
        homepage_sort_order: Number(form.homepage_sort_order) || 0,
        linked_product_id: form.linked_product_id || null,
        is_featured: form.is_featured,
        sort_order: Number(form.sort_order) || 0,
        original_price: form.original_price ? Number(form.original_price) : null,
        group_price: form.group_price ? Number(form.group_price) : null,
        threshold_type: form.threshold_type,
        threshold_value: form.threshold_value ? Number(form.threshold_value) : null,
        show_progress: form.show_progress,
        fulfillment_options: form.fulfillment_options,
        manual_tags: tags,
        category_label: form.category_label || null,
        expected_arrival_at: form.expected_arrival_at || null,
      };

      if (editing) {
        await fetch(`/api/admin/group-buy-events/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/group-buy-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/group-buy-events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  const productName = (id: string | null | undefined) =>
    products.find((p) => p.id === id)?.name ?? (id ? "已連結商品" : "—");

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="團購管理"
        description="團購活動、16:9 橫幅與首頁輪播（可導向商品）"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/group-buy/settings">
              <Button variant="secondary">團購頁面設定</Button>
            </Link>
            <Button onClick={openCreate}>新增團購</Button>
          </div>
        }
      />

      {showForm && (
        <div className="rounded-xl bg-white p-4 shadow-card space-y-4">
          <h2 className="font-medium text-coffee">{editing ? "編輯團購活動" : "新增團購活動"}</h2>

          <Input placeholder="活動標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input
            placeholder="活動簡稱（選填）"
            value={form.short_title}
            onChange={(e) => setForm({ ...form, short_title: e.target.value })}
          />
          <Input
            placeholder="團購分類標籤（選填）"
            value={form.category_label}
            onChange={(e) => setForm({ ...form, category_label: e.target.value })}
          />
          <textarea
            className="input-field min-h-[80px]"
            placeholder="活動說明"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <AdminImageUpload
            label="活動橫幅（16:9）"
            hint="建議尺寸 16:9，例如 1280×720 像素；點擊輪播可導向下方指定商品"
            images={form.banner_url ? [form.banner_url] : []}
            onChange={(urls) => setForm({ ...form, banner_url: urls[0] ?? "" })}
            multiple={false}
            maxImages={1}
            aspectRatio="video"
            uploadFolder="group-buy-banners"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-coffee">輪播導購商品</label>
            <select
              className="input-field w-full"
              value={form.linked_product_id}
              onChange={(e) => setForm({ ...form, linked_product_id: e.target.value })}
            >
              <option value="">不指定（連到團購活動頁）</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">首頁 16:9 輪播點擊後導向此商品頁</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
            <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
          <label className="block text-sm">
            預計到貨
            <Input
              type="datetime-local"
              className="mt-1"
              value={form.expected_arrival_at}
              onChange={(e) => setForm({ ...form, expected_arrival_at: e.target.value })}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              原價
              <Input
                type="number"
                className="mt-1"
                value={form.original_price}
                onChange={(e) => setForm({ ...form, original_price: e.target.value })}
              />
            </label>
            <label className="text-sm">
              團購價
              <Input
                type="number"
                className="mt-1"
                value={form.group_price}
                onChange={(e) => setForm({ ...form, group_price: e.target.value })}
              />
            </label>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-3">
            <p className="text-sm font-medium">成團門檻</p>
            <select
              className="input-field"
              value={form.threshold_type}
              onChange={(e) => setForm({ ...form, threshold_type: e.target.value })}
            >
              <option value="none">不設成團門檻</option>
              <option value="qty">滿件成團</option>
              <option value="people">滿人成團</option>
              <option value="amount">滿額成團</option>
            </select>
            {form.threshold_type !== "none" && (
              <Input
                type="number"
                placeholder="門檻數值"
                value={form.threshold_value}
                onChange={(e) => setForm({ ...form, threshold_value: e.target.value })}
              />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.show_progress}
                onChange={(e) => setForm({ ...form, show_progress: e.target.checked })}
              />
              顯示團購進度
            </label>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium">取貨／配送（至少一種）</p>
            {(
              [
                ["store_pickup", "門市取貨"],
                ["ambient", "常溫宅配"],
                ["chilled", "冷藏宅配"],
                ["frozen", "冷凍宅配"],
                ["cvs", "超商取貨"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.fulfillment_options.includes(value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...form.fulfillment_options, value]
                      : form.fulfillment_options.filter((x) => x !== value);
                    setForm({ ...form, fulfillment_options: next });
                  }}
                />
                {label}
              </label>
            ))}
          </div>

          <Input
            placeholder="人工標籤（最多 2 個，逗號分隔）"
            value={form.manual_tags}
            onChange={(e) => setForm({ ...form, manual_tags: e.target.value })}
          />

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              推薦團購
            </label>
            <label className="flex items-center gap-2">
              排序
              <Input
                type="number"
                className="max-w-[100px]"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </label>
          </div>

          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">草稿</option>
            <option value="active">進行中</option>
            <option value="ended">已結束</option>
          </select>

          <div className="rounded-lg border border-border bg-tag-bg/50 p-3 space-y-3">
            <p className="text-sm font-medium text-coffee">首頁輪播設定</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_homepage_featured}
                onChange={(e) => setForm({ ...form, is_homepage_featured: e.target.checked })}
              />
              顯示於首頁輪播
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground shrink-0">首頁排序</label>
              <Input
                type="number"
                min={0}
                className="max-w-[120px]"
                value={form.homepage_sort_order}
                onChange={(e) => setForm({ ...form, homepage_sort_order: Number(e.target.value) })}
              />
              <span className="text-xs text-muted-foreground">數字越小越前面</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.title}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (e) => e.title },
          {
            key: "status",
            header: "狀態",
            render: (e) => (
              <StatusBadge
                label={GROUP_BUY_STATUS_LABELS[e.status] ?? e.status}
                variant={groupBuyStatusVariant(e.status)}
              />
            ),
          },
          {
            key: "homepage",
            header: "首頁輪播",
            render: (e) =>
              e.is_homepage_featured ? (
                <StatusBadge label={`排序 ${e.homepage_sort_order ?? 0}`} variant="primary" />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
          {
            key: "product",
            header: "導購商品",
            render: (e) => <span className="text-xs">{productName(e.linked_product_id)}</span>,
          },
          {
            key: "period",
            header: "期間",
            render: (e) => (
              <span className="text-xs">
                {formatDate(e.start_at)} — {formatDate(e.end_at)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (e) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => openEdit(e)}>
                  編輯
                </Button>
                {e.status !== "active" && (
                  <Button size="sm" onClick={() => updateStatus(e.id, "active")}>
                    啟用
                  </Button>
                )}
                {e.status === "active" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(e.id, "ended")}>
                    結束
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
