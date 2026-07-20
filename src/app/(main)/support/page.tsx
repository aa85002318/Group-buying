"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Headphones, HelpCircle, MessageCircle, Package, Phone, Receipt, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/lib/site-links";

const QUICK_LINKS = [
  { href: APP_ROUTES.faq, label: "常見問題", icon: HelpCircle, desc: "快速找到解答" },
  { href: `${APP_ROUTES.faq}?category=order`, label: "訂單問題", icon: Package, desc: "付款、訂單狀態" },
  { href: `${APP_ROUTES.faq}?category=pickup`, label: "取貨問題", icon: Truck, desc: "門市取貨與 QR Code" },
  { href: `${APP_ROUTES.faq}?category=product`, label: "商品問題", icon: ShoppingBag, desc: "團購、收單、庫存" },
  { href: `${APP_ROUTES.faq}?category=carrier`, label: "發票載具說明", icon: Receipt, desc: "手機條碼設定與使用" },
] as const;

const CATEGORIES = [
  { value: "order", label: "訂單問題" },
  { value: "pickup", label: "取貨問題" },
  { value: "product", label: "商品問題" },
  { value: "payment", label: "付款問題" },
  { value: "carrier", label: "發票載具" },
  { value: "account", label: "帳號問題" },
  { value: "other", label: "其他" },
] as const;

const LINE_URL = "https://line.me/R/ti/p/@diy_chimei";
const PHONE = "02-2737-5508";

export default function SupportPage() {
  const [category, setCategory] = useState<string>("order");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !contactName.trim()) {
      alert("請填寫問題主旨、內容與聯絡姓名");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/support-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: message.trim(),
          message: message.trim(),
          orderId: orderId.trim() || undefined,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setSubmitted(true);
      setSubject("");
      setMessage("");
      setOrderId("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-xl font-bold text-[#173F75]">客服中心</h1>
        <p className="mt-1 text-sm text-[#6B7280]">我們會盡快協助您處理問題</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={LINE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-white p-4 shadow-[0_4px_24px_rgba(23,63,117,0.06)]"
        >
          <MessageCircle className="h-8 w-8 text-[#06C755]" />
          <div>
            <p className="font-medium text-[#202124]">LINE 客服</p>
            <p className="text-xs text-[#6B7280]">@diy_chimei</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-[#6B7280]" />
        </a>
        <a
          href={`tel:${PHONE.replace(/-/g, "")}`}
          className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-white p-4 shadow-[0_4px_24px_rgba(23,63,117,0.06)]"
        >
          <Phone className="h-8 w-8 text-[#E9285C]" />
          <div>
            <p className="font-medium text-[#202124]">電話客服</p>
            <p className="text-xs text-[#6B7280]">{PHONE}</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-[#6B7280]" />
        </a>
      </div>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-medium text-[#173F75]">
          <Headphones className="h-4 w-4" />
          快速協助
        </h2>
        <div className="space-y-2">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_4px_24px_rgba(23,63,117,0.06)]"
            >
              <item.icon className="h-5 w-5 shrink-0 text-[#E9285C]" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#202124]">{item.label}</p>
                <p className="text-xs text-[#6B7280]">{item.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#6B7280]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
        <h2 className="flex items-center gap-2 font-medium text-[#173F75]">
          <FileText className="h-4 w-4" />
          聯絡表單
        </h2>
        {submitted ? (
          <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            您的問題已送出，我們會盡快與您聯絡。
          </p>
        ) : (
          <form onSubmit={submitTicket} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">問題分類</label>
              <select
                className="input-field min-h-12 w-full rounded-lg border border-border bg-card px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Input className="min-h-12" placeholder="聯絡姓名 *" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            <Input className="min-h-12" type="tel" placeholder="聯絡電話" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            <Input className="min-h-12" type="email" placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            <Input className="min-h-12" placeholder="訂單編號（選填）" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <Input className="min-h-12" placeholder="問題主旨 *" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <textarea
              className="input-field min-h-[120px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              placeholder="請描述您的問題 *"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <Button type="submit" className="min-h-11 w-full bg-[#E9285C] hover:bg-[#C91F4D]" disabled={submitting}>
              {submitting ? "送出中…" : "送出問題"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
