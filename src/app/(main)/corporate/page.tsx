"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Gift, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SERVICES = [
  { icon: Gift, title: "企業下午茶", desc: "精緻點心組合，適合會議與訪客招待" },
  { icon: Package, title: "大量訂購", desc: "食材／包材批次採購與報價" },
  { icon: Users, title: "福委方案", desc: "員工福利、節慶禮盒、客製餐盒" },
  { icon: Building2, title: "企業合作", desc: "長期供貨、品牌聯名與活動合作" },
];

const TYPES = [
  { value: "afternoon_tea", label: "企業下午茶" },
  { value: "bulk_order", label: "大量訂購" },
  { value: "welfare", label: "福委方案" },
  { value: "custom_box", label: "客製餐盒" },
  { value: "partnership", label: "企業合作" },
  { value: "other", label: "其他" },
];

export default function CorporatePage() {
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    inquiry_type: "afternoon_tea",
    headcount: "",
    budget_range: "",
    preferred_date: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/corporate/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          headcount: form.headcount ? Number(form.headcount) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setDone(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter space-y-8 pb-8">
      <section className="rounded-[22px] bg-hero-gradient p-6 text-white shadow-lift">
        <h1 className="text-2xl font-black">企業福委中心</h1>
        <p className="mt-2 text-sm text-white/90">
          CHIMEIDIY 棋美點心屋 — 企業下午茶、大量訂購、福委方案與客製合作
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <div key={s.title} className="card-surface flex gap-3 p-4">
            <s.icon className="h-8 w-8 shrink-0 text-primary" />
            <div>
              <h2 className="font-bold text-coffee">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="card-surface p-5">
        <h2 className="text-lg font-black text-coffee">線上詢價</h2>
        <p className="mt-1 text-sm text-muted-foreground">留下需求，專人將於營業日與您聯繫報價。</p>

        {done ? (
          <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            詢價已送出，我們會盡快與您聯絡。也可先透過 LINE @diy_chimei 聯繫。
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Input className="min-h-12" placeholder="公司名稱 *" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            <Input className="min-h-12" placeholder="聯絡人 *" required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            <Input className="min-h-12" type="tel" placeholder="聯絡電話" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <Input className="min-h-12" type="email" placeholder="Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            <select className="input-field min-h-12" value={form.inquiry_type} onChange={(e) => setForm({ ...form, inquiry_type: e.target.value })}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <Input className="min-h-12" type="number" placeholder="人數" value={form.headcount} onChange={(e) => setForm({ ...form, headcount: e.target.value })} />
              <Input className="min-h-12" placeholder="預算區間" value={form.budget_range} onChange={(e) => setForm({ ...form, budget_range: e.target.value })} />
            </div>
            <Input className="min-h-12" placeholder="希望日期" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} />
            <textarea
              className="input-field min-h-[120px]"
              placeholder="需求說明 *"
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "送出中…" : "送出詢價"}
            </Button>
          </form>
        )}
      </section>

      <p className="text-center text-sm text-muted-foreground">
        一般團購請回 <Link href="/" className="font-bold text-primary">首頁</Link>
      </p>
    </div>
  );
}
