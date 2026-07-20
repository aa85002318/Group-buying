"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  FileText,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Receipt,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/lib/site-links";
import { externalLinkProps, isSafeLinkUrl } from "@/lib/cms/safeHtml";
import type { SupportSettings } from "@/lib/types/database";

const QUICK_LINKS = [
  { href: APP_ROUTES.faq, label: "常見問題", icon: HelpCircle, desc: "快速找到解答" },
  { href: "/support/orders", label: "訂單問題", icon: Package, desc: "App 訂單狀態與付款" },
  { href: "/support/shipping", label: "配送問題", icon: Truck, desc: "宅配與運送說明" },
  { href: "/support/returns", label: "退換貨", icon: FileText, desc: "退換貨說明" },
  { href: `${APP_ROUTES.faq}?category=carrier`, label: "發票載具", icon: Receipt, desc: "手機條碼設定" },
  { href: "/support/contact", label: "聯絡方式", icon: Headphones, desc: "電話／LINE／社群" },
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

export default function SupportPage() {
  const [settings, setSettings] = useState<Partial<SupportSettings>>({});
  const [category, setCategory] = useState("order");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/support-settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? {}))
      .catch(() => {});
  }, []);

  const lineUrl = settings.line_url && isSafeLinkUrl(settings.line_url) ? settings.line_url : null;
  const phone = settings.phone || "02-2737-5508";
  const fb = settings.facebook_url && isSafeLinkUrl(settings.facebook_url) ? settings.facebook_url : null;
  const ig = settings.instagram_url && isSafeLinkUrl(settings.instagram_url) ? settings.instagram_url : null;
  const mapUrl =
    settings.google_map_url && isSafeLinkUrl(settings.google_map_url) ? settings.google_map_url : null;

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
        <h1 className="text-xl font-bold text-foreground">客服中心</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          {settings.support_info || "我們會盡快協助您處理 App 相關問題"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {lineUrl && (
          <a
            href={lineUrl}
            {...externalLinkProps(lineUrl)}
            className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-surface p-4 shadow-card"
          >
            <MessageCircle className="h-8 w-8 text-success" />
            <div>
              <p className="font-medium text-foreground">LINE 客服</p>
              <p className="inline-flex items-center gap-1 text-xs text-foreground-secondary">
                外部連結 <ExternalLink className="h-3 w-3" />
              </p>
            </div>
            <ChevronRight className="ml-auto h-5 w-5 text-foreground-secondary" />
          </a>
        )}
        <a
          href={`tel:${phone.replace(/-/g, "")}`}
          className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-surface p-4 shadow-card"
        >
          <Phone className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium text-foreground">電話客服</p>
            <p className="text-xs text-foreground-secondary">{phone}</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-foreground-secondary" />
        </a>
        {settings.email && (
          <a
            href={`mailto:${settings.email}`}
            className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-surface p-4 shadow-card"
          >
            <Mail className="h-8 w-8 text-info" />
            <div>
              <p className="font-medium text-foreground">Email</p>
              <p className="text-xs text-foreground-secondary">{settings.email}</p>
            </div>
            <ChevronRight className="ml-auto h-5 w-5 text-foreground-secondary" />
          </a>
        )}
        {fb && (
          <a
            href={fb}
            {...externalLinkProps(fb)}
            className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-surface p-4 shadow-card"
          >
            <FileText className="h-8 w-8 text-info" />
            <div>
              <p className="font-medium text-foreground">Facebook</p>
              <p className="inline-flex items-center gap-1 text-xs text-foreground-secondary">
                外部連結 <ExternalLink className="h-3 w-3" />
              </p>
            </div>
            <ChevronRight className="ml-auto h-5 w-5 text-foreground-secondary" />
          </a>
        )}
        {ig && (
          <a
            href={ig}
            {...externalLinkProps(ig)}
            className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-surface p-4 shadow-card"
          >
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">Instagram</p>
              <p className="inline-flex items-center gap-1 text-xs text-foreground-secondary">
                外部連結 <ExternalLink className="h-3 w-3" />
              </p>
            </div>
            <ChevronRight className="ml-auto h-5 w-5 text-foreground-secondary" />
          </a>
        )}
      </div>

      {(settings.address || settings.business_hours || mapUrl) && (
        <section className="rounded-[20px] bg-surface p-4 shadow-card">
          <h2 className="font-bold text-caramel">門市資訊</h2>
          {settings.address && (
            <p className="mt-2 flex items-start gap-2 text-sm text-foreground-secondary">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {settings.address}
            </p>
          )}
          {settings.business_hours && (
            <p className="mt-1 text-sm text-foreground-secondary">營業時間：{settings.business_hours}</p>
          )}
          {mapUrl && (
            <a
              href={mapUrl}
              {...externalLinkProps(mapUrl)}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Google 地圖 <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-caramel">快速協助</h2>
        <div className="space-y-2">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-[18px] bg-surface px-4 py-3 shadow-card"
            >
              <item.icon className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-foreground-secondary">{item.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] bg-surface p-5 shadow-card">
        <h2 className="font-medium text-caramel">聯絡表單</h2>
        {submitted ? (
          <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            您的問題已送出，我們會盡快與您聯絡。
          </p>
        ) : (
          <form onSubmit={submitTicket} className="mt-4 space-y-3">
            <select
              className="input-field min-h-12 w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <Input className="min-h-12" placeholder="聯絡姓名 *" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            <Input className="min-h-12" type="tel" placeholder="聯絡電話" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            <Input className="min-h-12" type="email" placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            <Input className="min-h-12" placeholder="App 訂單編號（選填）" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <Input className="min-h-12" placeholder="問題主旨 *" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <textarea
              className="input-field min-h-[120px] w-full"
              placeholder="請描述您的問題 *"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <Button type="submit" className="min-h-11 w-full bg-primary" disabled={submitting}>
              {submitting ? "送出中…" : "送出問題"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
