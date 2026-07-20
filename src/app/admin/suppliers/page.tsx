"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  note: string | null;
  is_active: boolean;
  product_count: number;
};

const emptyForm = {
  name: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  note: "",
  is_active: true,
};

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setCreating(false);
    setForm({
      name: supplier.name,
      contact_name: supplier.contact_name ?? "",
      contact_phone: supplier.contact_phone ?? "",
      contact_email: supplier.contact_email ?? "",
      note: supplier.note ?? "",
      is_active: supplier.is_active,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (creating) {
        await fetch("/api/admin/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else if (editing) {
        await fetch(`/api/admin/suppliers/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      closeForm();
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (supplier: Supplier) => {
    if (!confirm(`確定停用供應商「${supplier.name}」？`)) return;
    await fetch(`/api/admin/suppliers/${supplier.id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="供應商管理"
        description="管理商品供應商與聯絡資訊"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            新增供應商
          </Button>
        }
      />

      {(creating || editing) && (
        <div className="rounded-[20px] border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="font-semibold text-foreground">{creating ? "新增供應商" : `編輯：${editing?.name}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="供應商名稱 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="聯絡人" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            <Input placeholder="電話" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <Input placeholder="Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <Input placeholder="備註" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            啟用中
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            <Button variant="outline" onClick={closeForm}>
              取消
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        loading={loading}
        emptyText="尚無供應商"
        columns={[
          { key: "name", header: "供應商", render: (s) => <span className="font-medium text-foreground">{s.name}</span> },
          { key: "contact", header: "聯絡人", render: (s) => s.contact_name ?? "—" },
          { key: "phone", header: "電話", render: (s) => s.contact_phone ?? "—" },
          { key: "email", header: "Email", render: (s) => s.contact_email ?? "—" },
          { key: "product_count", header: "商品數", render: (s) => s.product_count },
          {
            key: "status",
            header: "狀態",
            render: (s) => <StatusBadge label={s.is_active ? "啟用" : "停用"} variant={s.is_active ? "success" : "default"} />,
          },
          {
            key: "actions",
            header: "",
            render: (s) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ),
          },
        ]}
        rows={suppliers}
      />
    </div>
  );
}
