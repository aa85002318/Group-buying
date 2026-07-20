"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { SupportSettings } from "@/lib/types/database";

export default function AdminSupportSettingsPage() {
  const [form, setForm] = useState({
    phone: "",
    email: "",
    line_url: "",
    facebook_url: "",
    instagram_url: "",
    address: "",
    business_hours: "",
    google_map_url: "",
    returns_info: "",
    shipping_info: "",
    support_info: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/support-settings")
      .then((r) => r.json())
      .then((d) => {
        const s = (d.settings ?? {}) as SupportSettings;
        setForm({
          phone: s.phone ?? "",
          email: s.email ?? "",
          line_url: s.line_url ?? "",
          facebook_url: s.facebook_url ?? "",
          instagram_url: s.instagram_url ?? "",
          address: s.address ?? "",
          business_hours: s.business_hours ?? "",
          google_map_url: s.google_map_url ?? "",
          returns_info: s.returns_info ?? "",
          shipping_info: s.shipping_info ?? "",
          support_info: s.support_info ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      alert("已儲存客服設定");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">載入中…</p>;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="客服設定"
        description="集中管理聯絡資訊與說明文案，前台客服中心會讀取此設定。"
      />
      <div className="max-w-2xl space-y-3 rounded-xl bg-white p-4 shadow-card">
        <Input placeholder="電話" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="LINE URL" value={form.line_url} onChange={(e) => setForm({ ...form, line_url: e.target.value })} />
        <Input placeholder="Facebook URL" value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} />
        <Input placeholder="Instagram URL" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
        <Input placeholder="門市地址" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input placeholder="營業時間" value={form.business_hours} onChange={(e) => setForm({ ...form, business_hours: e.target.value })} />
        <Input placeholder="Google Map URL" value={form.google_map_url} onChange={(e) => setForm({ ...form, google_map_url: e.target.value })} />
        <textarea
          className="input-field min-h-[80px] w-full"
          placeholder="客服說明"
          value={form.support_info}
          onChange={(e) => setForm({ ...form, support_info: e.target.value })}
        />
        <textarea
          className="input-field min-h-[80px] w-full"
          placeholder="配送說明"
          value={form.shipping_info}
          onChange={(e) => setForm({ ...form, shipping_info: e.target.value })}
        />
        <textarea
          className="input-field min-h-[80px] w-full"
          placeholder="退換貨說明"
          value={form.returns_info}
          onChange={(e) => setForm({ ...form, returns_info: e.target.value })}
        />
        <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
      </div>
    </div>
  );
}
