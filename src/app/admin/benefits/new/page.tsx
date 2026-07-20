"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";

export default function AdminBenefitsNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    image_url: "",
    usage_instructions: "",
    usage_location: "門市出示會員碼",
    status: "draft",
    starts_at: "",
    ends_at: "",
  });

  const save = async () => {
    if (!form.title.trim()) {
      alert("請填寫名稱");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/benefits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      router.push(`/admin/benefits/${data.benefit.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="新增會員福利" description="建立後可啟用並發放給 App 會員" />
      <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
        <AdminImageUpload
          label="封面圖"
          images={form.image_url ? [form.image_url] : []}
          onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
          uploadFolder="benefits"
          maxImages={1}
          multiple={false}
        />
        <Input placeholder="福利名稱 *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="摘要" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <textarea
          className="input-field min-h-[100px]"
          placeholder="說明"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Input
          placeholder="使用方式"
          value={form.usage_instructions}
          onChange={(e) => setForm({ ...form, usage_instructions: e.target.value })}
        />
        <Input
          placeholder="使用地點"
          value={form.usage_location}
          onChange={(e) => setForm({ ...form, usage_location: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">草稿</option>
            <option value="active">啟用</option>
            <option value="disabled">停用</option>
          </select>
          <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "建立"}</Button>
          <Button variant="secondary" onClick={() => router.push("/admin/benefits")}>取消</Button>
        </div>
      </div>
    </div>
  );
}
