"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";

type KitRow = {
  id: string;
  name: string;
  cover_image_url: string | null;
  recipe_id: string | null;
  kit_price: number | null;
  button_text: string;
  sort_order: number;
  is_active: boolean;
  hide_when_oos: boolean;
  recipes?: { id: string; title: string } | null;
  home_recipe_kit_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    is_required: boolean;
    products?: { id: string; name: string } | null;
  }>;
};

const emptyForm = {
  name: "",
  cover_image_url: "",
  recipe_id: "",
  kit_price: "",
  button_text: "全部加入購物車",
  sort_order: "0",
  is_active: true,
  hide_when_oos: true,
  product_ids: "",
};

export default function AdminRecipeKitsPage() {
  const [kits, setKits] = useState<KitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/home/recipe-kits")
      .then((r) => r.json())
      .then((d) => setKits(d.kits ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: String((kits.length + 1) * 10) });
    setShowForm(true);
  };

  const openEdit = (kit: KitRow) => {
    setEditingId(kit.id);
    setForm({
      name: kit.name,
      cover_image_url: kit.cover_image_url ?? "",
      recipe_id: kit.recipe_id ?? "",
      kit_price: kit.kit_price != null ? String(kit.kit_price) : "",
      button_text: kit.button_text || "全部加入購物車",
      sort_order: String(kit.sort_order ?? 0),
      is_active: kit.is_active,
      hide_when_oos: kit.hide_when_oos,
      product_ids: (kit.home_recipe_kit_items ?? [])
        .map((i) => `${i.product_id}:${i.quantity}`)
        .join("\n"),
    });
    setShowForm(true);
  };

  const parseItems = () =>
    form.product_ids
      .split(/[\n,]+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [product_id, qty] = line.split(":").map((s) => s.trim());
        return {
          product_id,
          quantity: Math.max(1, Number(qty) || 1),
          is_required: true,
          sort_order: (index + 1) * 10,
        };
      })
      .filter((i) => i.product_id);

  const save = async () => {
    if (!form.name.trim()) {
      alert("請填寫材料包名稱");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        cover_image_url: form.cover_image_url || null,
        recipe_id: form.recipe_id || null,
        kit_price: form.kit_price ? Number(form.kit_price) : null,
        button_text: form.button_text || "全部加入購物車",
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        hide_when_oos: form.hide_when_oos,
        items: parseItems(),
      };
      const res = await fetch(
        editingId ? `/api/admin/home/recipe-kits/${editingId}` : "/api/admin/home/recipe-kits",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除此材料包？")) return;
    await fetch(`/api/admin/home/recipe-kits/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="材料包管理"
        description="綁定食譜與商品 SKU；前台可一鍵全部加入購物車。商品列格式：productId:數量（一行一項）。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>新增材料包</Button>
            <Link
              href="/admin/home"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel"
            >
              返回首頁管理
            </Link>
          </div>
        }
      />

      {showForm ? (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <Input
            placeholder="材料包名稱"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <AdminImageUpload
            label="封面圖片"
            images={form.cover_image_url ? [form.cover_image_url] : []}
            onChange={(imgs) => setForm({ ...form, cover_image_url: imgs[0] ?? "" })}
            uploadFolder="recipe-kits"
            maxImages={1}
            multiple={false}
          />
          <Input
            placeholder="綁定食譜 UUID（選填）"
            value={form.recipe_id}
            onChange={(e) => setForm({ ...form, recipe_id: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="材料包優惠價"
              value={form.kit_price}
              onChange={(e) => setForm({ ...form, kit_price: e.target.value })}
            />
            <Input
              placeholder="按鈕文字"
              value={form.button_text}
              onChange={(e) => setForm({ ...form, button_text: e.target.value })}
            />
            <Input
              type="number"
              placeholder="排序"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
          <textarea
            className="input-field min-h-[120px] w-full font-mono text-xs"
            placeholder={"商品清單（每行一個）\nuuid:1\nuuid:2"}
            value={form.product_ids}
            onChange={(e) => setForm({ ...form, product_ids: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            啟用
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.hide_when_oos}
              onChange={(e) => setForm({ ...form, hide_when_oos: e.target.checked })}
            />
            缺貨時略過該商品仍可加入其他項
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              取消
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-foreground-secondary">載入中…</p>
      ) : (
        <AdminTable
          columns={[
            { key: "name", header: "名稱", render: (k) => k.name },
            {
              key: "recipe",
              header: "食譜",
              render: (k) => k.recipes?.title || k.recipe_id || "—",
            },
            {
              key: "items",
              header: "商品數",
              render: (k) => k.home_recipe_kit_items?.length ?? 0,
            },
            {
              key: "status",
              header: "狀態",
              render: (k) => (
                <StatusBadge
                  label={k.is_active ? "啟用" : "停用"}
                  variant={k.is_active ? "success" : "secondary"}
                />
              ),
            },
            { key: "sort", header: "排序", render: (k) => k.sort_order },
            {
              key: "actions",
              header: "操作",
              render: (k) => (
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(k)}>
                    編輯
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => remove(k.id)}>
                    刪除
                  </Button>
                </div>
              ),
            },
          ]}
          rows={kits}
        />
      )}
    </div>
  );
}
