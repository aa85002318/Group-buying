"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import {
  emptyProductForm,
  formToPayload,
  productToForm,
  validateProductForm,
  calcGrossMargin,
} from "@/lib/admin/product-form";
import { formatCurrency } from "@/lib/utils";
import type { Product, ProductCategory, Store } from "@/lib/types/database";

export default function AdminProductsPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Product>(
    "/api/admin/products",
    "products",
    ["name"]
  );
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyProductForm());

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
    ])
      .then(([catRes, storeRes]) => {
        setCategories(catRes.categories ?? []);
        setStores(storeRes.stores ?? []);
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProductForm());
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm(productToForm(p));
    setShowForm(true);
  };

  const save = async () => {
    const err = validateProductForm(form);
    if (err) {
      alert(err);
      return;
    }

    setSaving(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch(
        editing ? "/api/admin/products" : "/api/admin/products",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setShowForm(false);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="商品管理"
        description="完整商品上架：分類、價格、團購、門市、供應商與產品資訊"
        actions={<Button onClick={openCreate}>新增商品</Button>}
      />

      {showForm ? (
        <AdminProductForm
          title={editing ? "編輯商品" : "新增商品"}
          form={form}
          onChange={setForm}
          categories={categories}
          stores={stores}
          saving={saving}
          onSave={save}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      <AdminTable
        columns={[
          { key: "name", header: "商品名稱", render: (p) => p.name },
          {
            key: "category",
            header: "分類",
            render: (p) => (p.product_categories as { name?: string } | undefined)?.name ?? "—",
          },
          {
            key: "price",
            header: "團購價",
            render: (p) => formatCurrency(p.price),
          },
          {
            key: "original",
            header: "原價",
            render: (p) => (p.original_price != null ? formatCurrency(p.original_price) : "—"),
          },
          { key: "stock", header: "庫存", render: (p) => p.stock },
          {
            key: "group",
            header: "團購",
            render: (p) => (
              <StatusBadge
                label={p.is_group_buy ? "是" : "否"}
                variant={p.is_group_buy ? "primary" : "secondary"}
              />
            ),
          },
          {
            key: "margin",
            header: "毛利",
            render: (p) => {
              const m = calcGrossMargin(String(p.price), String(p.cost_price ?? ""));
              return m != null ? formatCurrency(m) : "—";
            },
          },
          {
            key: "status",
            header: "上架",
            render: (p) => (
              <StatusBadge label={p.is_active ? "上架" : "下架"} variant={p.is_active ? "success" : "secondary"} />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (p) => (
              <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                編輯
              </Button>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋商品名稱…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
