"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShopCmsLiveSaveNotice } from "@/components/admin/shop/ShopCmsLiveSaveNotice";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShopAiChip } from "@/lib/shop/ai-assistant";
import { cn } from "@/lib/utils";

type FormState = {
  label: string;
  emoji: string;
  prompt: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  label: "",
  emoji: "✨",
  prompt: "",
  sort_order: "100",
  is_active: true,
};

export default function AdminShopAiChipsPage() {
  const [chips, setChips] = useState<ShopAiChip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/shop/ai-chips")
      .then((r) => r.json())
      .then((d) => setChips(d.chips ?? []))
      .catch(() => setChips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (c: ShopAiChip) => {
    setEditingId(c.id);
    setForm({
      label: c.label,
      emoji: c.emoji,
      prompt: c.prompt,
      sort_order: String(c.sort_order),
      is_active: c.is_active,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: String(chips.length + 1) });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.label.trim()) {
      alert("請填寫標籤");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        emoji: form.emoji.trim() || "✨",
        prompt: form.prompt.trim() || form.label.trim(),
        sort_order: Number(form.sort_order) || 100,
        is_active: form.is_active,
      };
      const res = await fetch(
        editingId ? `/api/admin/shop/ai-chips/${editingId}` : "/api/admin/shop/ai-chips",
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

  const toggleActive = async (c: ShopAiChip) => {
    await fetch(`/api/admin/shop/ai-chips/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="AI 推薦 Chip"
        description="管理商城 AI 烘焙助手快速推薦標籤：新增、排序、上下架。"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/shop?section=ai-chips" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Button size="sm" onClick={openCreate}>
              新增 Chip
            </Button>
          </div>
        }
      />

      <ShopCmsLiveSaveNotice section="ai-chips" />

      {showForm ? (
        <div className="space-y-3 rounded-xl border border-border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              標籤
              <Input className="mt-1" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </label>
            <label className="text-sm">
              Emoji
              <Input className="mt-1" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            </label>
            <label className="text-sm md:col-span-2">
              Prompt
              <Input className="mt-1" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
            </label>
            <label className="text-sm">
              排序
              <Input className="mt-1" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              上架
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </div>
      ) : null}

      <AdminTable
        loading={loading}
        rows={chips}
        columns={[
          { key: "emoji", header: "", render: (c) => c.emoji },
          { key: "label", header: "標籤", render: (c) => c.label },
          { key: "prompt", header: "Prompt", render: (c) => c.prompt },
          { key: "sort", header: "排序", render: (c) => c.sort_order },
          {
            key: "status",
            header: "狀態",
            render: (c) => (
              <StatusBadge
                label={c.is_active ? "上架" : "下架"}
                variant={c.is_active ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (c) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>編輯</Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                  {c.is_active ? "下架" : "上架"}
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
