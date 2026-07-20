"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Star } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITY_NAMES, TAIWAN_CITIES } from "@/lib/taiwan-regions";
import { APP_ROUTES } from "@/lib/site-links";

type Address = {
  id: string;
  recipient_name: string;
  phone: string;
  postal_code: string | null;
  city: string;
  district: string;
  address_line: string;
  label: string | null;
  is_default: boolean;
};

const emptyForm = {
  recipient_name: "",
  phone: "",
  postal_code: "",
  city: "",
  district: "",
  address_line: "",
  label: "",
  is_default: false,
};

export default function MemberAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/member/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const districts = form.city ? TAIWAN_CITIES[form.city] ?? [] : [];

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    setCreating(false);
    setForm({
      recipient_name: a.recipient_name,
      phone: a.phone,
      postal_code: a.postal_code ?? "",
      city: a.city,
      district: a.district,
      address_line: a.address_line,
      label: a.label ?? "",
      is_default: a.is_default,
    });
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/member/addresses/${editing.id}` : "/api/member/addresses";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "儲存失敗");
      return;
    }
    setCreating(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除此地址？")) return;
    await fetch(`/api/member/addresses/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={APP_ROUTES.member}><ArrowLeft className="h-5 w-5 text-caramel" /></Link>
            <h1 className="text-xl font-bold text-caramel">收件地址</h1>
          </div>
          <Button size="sm" onClick={openCreate} className="bg-primary"><Plus className="mr-1 h-4 w-4" />新增</Button>
        </div>

        {(creating || editing) && (
          <div className="space-y-3 rounded-[20px] bg-surface p-5 shadow-card">
            <h2 className="font-semibold text-caramel">{creating ? "新增地址" : "編輯地址"}</h2>
            <Input className="min-h-12" placeholder="收件人姓名 *" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
            <Input className="min-h-12" placeholder="手機 *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="input-field min-h-12" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, district: "" })}>
                <option value="">縣市 *</option>
                {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input-field min-h-12" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} disabled={!form.city}>
                <option value="">行政區 *</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <Input className="min-h-12" placeholder="郵遞區號（選填）" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
            <Input className="min-h-12" placeholder="詳細地址 *" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
            <Input className="min-h-12" placeholder="地址標籤（選填）如：家、公司" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              設為預設地址
            </label>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-2">
              <Button className="min-h-11 flex-1 bg-primary" onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
              <Button variant="outline" className="min-h-11" onClick={() => { setCreating(false); setEditing(null); }}>取消</Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-foreground-secondary">載入中…</p>
        ) : addresses.length === 0 ? (
          <p className="rounded-[20px] bg-surface py-12 text-center text-foreground-secondary shadow-card">尚無收件地址</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-[20px] bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{a.recipient_name} · {a.phone}</p>
                    <p className="mt-1 text-sm text-foreground-secondary">{a.city}{a.district}{a.address_line}</p>
                    {a.label && <p className="mt-1 text-xs text-caramel">{a.label}</p>}
                  </div>
                  {a.is_default && <Star className="h-5 w-5 fill-warning text-warning" />}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(a)}>編輯</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(a.id)} className="text-error">刪除</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
