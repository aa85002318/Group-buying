"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import type { FaqItem } from "@/lib/types/database";

const FAQ_CATEGORIES = [
  "購物",
  "付款",
  "配送",
  "團購",
  "門市取貨",
  "會員",
  "發票載具",
  "App 訂單",
  "退換貨",
  "課程",
  "其他",
];

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: FAQ_CATEGORIES[0],
    question: "",
    answer: "",
    sort_order: "0",
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/faqs")
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      category: FAQ_CATEGORIES[0],
      question: "",
      answer: "",
      sort_order: "0",
      is_featured: false,
    });
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) return alert("請填寫問題與答案");
    setSaving(true);
    try {
      const payload = {
        category: form.category,
        question: form.question,
        answer: form.answer,
        sort_order: Number(form.sort_order) || 0,
        is_featured: form.is_featured,
      };
      const res = await fetch(editingId ? `/api/admin/faqs/${editingId}` : "/api/admin/faqs", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      resetForm();
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (faq: FaqItem, field: "is_active" | "is_featured") => {
    await fetch(`/api/admin/faqs/${faq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !faq[field] }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除此 FAQ？")) return;
    await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = faqs.filter((f) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="FAQ 管理" description="常見問題：分類、熱門、排序、啟停用" />

      <div className="max-w-2xl space-y-3 rounded-xl bg-white p-4 shadow-card">
        <h2 className="font-medium">{editingId ? "編輯 FAQ" : "新增 FAQ"}</h2>
        <select
          className="input-field w-full"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {FAQ_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Input placeholder="問題" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        <textarea
          className="input-field min-h-[100px] w-full"
          placeholder="答案（純文字為主）"
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="w-28"
            placeholder="排序"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            熱門問題
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : editingId ? "更新" : "新增"}</Button>
          {editingId && (
            <Button variant="secondary" onClick={resetForm}>取消編輯</Button>
          )}
        </div>
      </div>

      <Input
        className="max-w-sm"
        placeholder="搜尋 FAQ…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <AdminTable
        columns={[
          { key: "category", header: "分類", render: (f) => f.category },
          { key: "question", header: "問題", render: (f) => f.question },
          { key: "sort", header: "排序", render: (f) => f.sort_order },
          {
            key: "hot",
            header: "熱門",
            render: (f) => (f.is_featured ? "是" : "—"),
          },
          {
            key: "status",
            header: "狀態",
            render: (f) => (f.is_active ? "啟用" : "停用"),
          },
          {
            key: "actions",
            header: "操作",
            render: (f) => (
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(f.id);
                    setForm({
                      category: f.category,
                      question: f.question,
                      answer: f.answer,
                      sort_order: String(f.sort_order),
                      is_featured: Boolean(f.is_featured),
                    });
                  }}
                >
                  編輯
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggle(f, "is_featured")}>
                  {f.is_featured ? "取消熱門" : "設熱門"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggle(f, "is_active")}>
                  {f.is_active ? "停用" : "啟用"}
                </Button>
                <Button size="sm" variant="outline" className="text-error" onClick={() => remove(f.id)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={filtered}
        loading={loading}
        emptyText="尚無 FAQ"
      />
    </div>
  );
}
