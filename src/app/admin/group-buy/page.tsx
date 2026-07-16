"use client";

import { useEffect, useState } from "react";
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
  description: "",
  start_at: "",
  end_at: "",
  status: "draft",
  banner_url: "",
  is_homepage_featured: false,
  homepage_sort_order: 0,
  linked_product_id: "",
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
      description: e.description ?? "",
      start_at: e.start_at ? e.start_at.slice(0, 16) : "",
      end_at: e.end_at ? e.end_at.slice(0, 16) : "",
      status: e.status,
      banner_url: e.banner_url ?? "",
      is_homepage_featured: e.is_homepage_featured ?? false,
      homepage_sort_order: e.homepage_sort_order ?? 0,
      linked_product_id: e.linked_product_id ?? "",
    });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        start_at: form.start_at || new Date().toISOString(),
        end_at: form.end_at || new Date(Date.now() + 7 * 86400000).toISOString(),
        status: form.status,
        banner_url: form.banner_url || null,
        banner_aspect_ratio: "16:9",
        is_homepage_featured: form.is_homepage_featured,
        homepage_sort_order: Number(form.homepage_sort_order) || 0,
        linked_product_id: form.linked_product_id || null,
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
        actions={<Button onClick={openCreate}>新增團購</Button>}
      />

      {showForm && (
        <div className="rounded-xl bg-white p-4 shadow-card space-y-4">
          <h2 className="font-medium text-coffee">{editing ? "編輯團購活動" : "新增團購活動"}</h2>

          <Input placeholder="活動標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
