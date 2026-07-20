"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";

type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_active: boolean;
  sort_order: number;
};

const CATEGORIES = [
  "會員帳號",
  "訂單與付款",
  "團購與收單",
  "取貨方式",
  "配送方式",
  "發票載具",
  "退換貨",
  "其他",
];

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: CATEGORIES[0], question: "", answer: "", sort_order: "0" });
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

  const createFaq = async () => {
    if (!form.question.trim() || !form.answer.trim()) return alert("請填寫問題與答案");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          question: form.question,
          answer: form.answer,
          sort_order: Number(form.sort_order) || 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setForm({ category: CATEGORIES[0], question: "", answer: "", sort_order: "0" });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (faq: Faq) => {
    await fetch(`/api/admin/faqs/${faq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !faq.is_active }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="FAQ 管理" description="常見問題內容維護" />

      <div className="max-w-2xl space-y-3 rounded-xl bg-white p-4 shadow-card">
        <h2 className="font-medium">新增 FAQ</h2>
        <select
          className="input-field w-full rounded-lg border px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Input placeholder="問題" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        <textarea
          className="input-field min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="答案"
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
        />
        <Input placeholder="排序" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        <Button onClick={createFaq} disabled={saving}>
          {saving ? "儲存中…" : "新增 FAQ"}
        </Button>
      </div>

      <AdminTable
        columns={[
          { key: "category", header: "分類", render: (f) => f.category },
          { key: "question", header: "問題", render: (f) => f.question },
          { key: "sort", header: "排序", render: (f) => f.sort_order },
          {
            key: "status",
            header: "狀態",
            render: (f) => (f.is_active ? "啟用" : "停用"),
          },
          {
            key: "actions",
            header: "操作",
            render: (f) => (
              <Button size="sm" variant="outline" onClick={() => toggleActive(f)}>
                {f.is_active ? "停用" : "啟用"}
              </Button>
            ),
          },
        ]}
        rows={faqs}
        loading={loading}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
      />
    </div>
  );
}
