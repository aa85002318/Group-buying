"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";
import { useInquiryCart } from "@/hooks/useInquiryCart";

type FormState = {
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  company_name: string;
  delivery_info: string;
  preferred_contact_time: string;
  message: string;
};

const EMPTY_FORM: FormState = {
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  company_name: "",
  delivery_info: "",
  preferred_contact_time: "",
  message: "",
};

const CONTACT_TIME_PRESETS = [
  "平日上午（09:00–12:00）",
  "平日下午（13:00–18:00）",
  "平日晚間（18:00–21:00）",
  "假日皆可",
];

export default function InquiryPage() {
  const router = useRouter();
  const cart = useInquiryCart();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ itemCount: number; message: string } | null>(null);

  // 詢價要能追蹤與回覆，所以限會員。沒登入先把購物清單留著，只擋送出那一步。
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.profile) {
          setLoggedIn(true);
          setForm((prev) => ({
            ...prev,
            contact_name: prev.contact_name || String(d.profile.full_name ?? ""),
            contact_phone: prev.contact_phone || String(d.profile.phone ?? ""),
            contact_email: prev.contact_email || String(d.user?.email ?? ""),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const patch = (partial: Partial<FormState>) => setForm((prev) => ({ ...prev, ...partial }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.contact_name.trim()) return setError("請填寫聯絡人姓名");
    if (!form.contact_phone.trim()) return setError("請填寫聯絡電話");
    if (cart.items.length === 0) return setError("詢價單是空的，請先選擇商品");

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart.items.map((i) => ({
            product_id: i.productId,
            quantity: i.quantity,
            note: i.note ?? null,
          })),
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setError("請先登入會員才能送出詢價單。");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setDone({
        itemCount: data.inquiry?.item_count ?? cart.items.length,
        message: data.message ?? "已送出詢價單。",
      });
      cart.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-10">
        <div className="rounded-2xl border border-[#BBD4F5] bg-[#EAF2FF] p-6 text-center">
          <h1 className="text-xl font-bold text-[#153E73]">詢價單已送出</h1>
          <p className="mt-2 text-sm text-[#153E73]">{done.message}</p>
          <p className="mt-1 text-xs text-[#667085]">共 {done.itemCount} 項商品</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/shop"
              className="flex h-11 items-center rounded-full bg-[#153E73] px-5 text-sm font-bold text-white"
            >
              繼續逛商品
            </Link>
            <Link
              href="/profile"
              className="flex h-11 items-center rounded-full border-2 border-[#FEE169] bg-white px-5 text-sm font-bold text-[#153E73]"
            >
              回會員中心
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-4 px-4 py-4 pb-28">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#153E73]">
          <FileText className="h-5 w-5" aria-hidden />
          我的詢價單
        </h1>
        <p className="mt-1 text-sm text-[#667085]">
          勾選的商品可以一次送出，我們會回覆一份正式報價單。
        </p>
      </header>

      {authChecked && !loggedIn ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#FEE169] bg-[#FFFBEA] px-4 py-3 text-sm text-[#8A6A00]">
          <span>詢價需要登入會員，方便後續聯絡與回覆報價單。</span>
          <button
            type="button"
            onClick={() => router.push(`/auth/login?next=${encodeURIComponent("/inquiry")}`)}
            className="rounded-full bg-[#153E73] px-4 py-1.5 text-xs font-bold text-white"
          >
            前往登入
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-[#F5C6C2] bg-[#FFF1F0] px-4 py-3 text-sm text-[#C0392B]">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-[#E8E1D7] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#153E73]">
            詢價商品（{cart.items.length}／{cart.maxItems}）
          </h2>
          {cart.items.length > 0 ? (
            <button
              type="button"
              onClick={() => cart.clear()}
              className="text-xs text-[#8A94A6] underline"
            >
              全部清空
            </button>
          ) : null}
        </div>

        {!cart.ready ? (
          <p className="py-8 text-center text-sm text-[#8A94A6]">載入中…</p>
        ) : cart.items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#8A94A6]">詢價單還是空的。</p>
            <Link href="/shop" className="mt-2 inline-block text-sm text-[#153E73] underline">
              去挑選商品
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {cart.items.map((item) => (
              <li
                key={item.productId}
                className="flex gap-3 rounded-xl border border-[#F0EDE7] p-3"
              >
                <Link
                  href={`/products/${item.productId}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F8F7F4]"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.productId}`}
                    className="line-clamp-2 text-sm font-medium text-[#153E73]"
                  >
                    {item.name}
                  </Link>
                  {item.spec ? (
                    <p className="mt-0.5 text-xs text-[#8A94A6]">{item.spec}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-full border border-[#E8E1D7]">
                      <button
                        type="button"
                        className="h-9 w-9 text-lg disabled:opacity-40"
                        disabled={item.quantity <= 1}
                        onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          cart.setQuantity(item.productId, Number.isFinite(n) && n > 0 ? n : 1);
                        }}
                        className="w-14 border-0 bg-transparent text-center text-sm font-semibold focus:outline-none"
                        aria-label="詢價數量"
                      />
                      <button
                        type="button"
                        className="h-9 w-9 text-lg"
                        onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.note ?? ""}
                      placeholder="這項的備註（選填）"
                      maxLength={500}
                      onChange={(e) => cart.setNote(item.productId, e.target.value)}
                      className="min-w-0 flex-1 rounded-full border border-[#E8E1D7] px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => cart.removeItem(item.productId)}
                      aria-label="移除這項"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[#8A94A6] hover:bg-[#F8F7F4]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={submit} className="space-y-4">
        <section className="rounded-2xl border border-[#E8E1D7] bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#153E73]">聯絡資料</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-[#667085]">
                姓名 <span className="text-[#F16458]">*</span>
              </span>
              <input
                className="w-full rounded-xl border border-[#E8E1D7] px-3 py-2.5 text-sm"
                value={form.contact_name}
                onChange={(e) => patch({ contact_name: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[#667085]">
                聯絡電話 <span className="text-[#F16458]">*</span>
              </span>
              <input
                className="w-full rounded-xl border border-[#E8E1D7] px-3 py-2.5 text-sm"
                value={form.contact_phone}
                onChange={(e) => patch({ contact_phone: e.target.value })}
                inputMode="tel"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[#667085]">Email（選填）</span>
              <input
                className="w-full rounded-xl border border-[#E8E1D7] px-3 py-2.5 text-sm"
                type="email"
                value={form.contact_email}
                onChange={(e) => patch({ contact_email: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[#667085]">公司／單位（選填）</span>
              <input
                className="w-full rounded-xl border border-[#E8E1D7] px-3 py-2.5 text-sm"
                value={form.company_name}
                onChange={(e) => patch({ company_name: e.target.value })}
                placeholder="個人詢價可留空"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E8E1D7] bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#153E73]">配送與聯絡時間</h2>
          <label className="block text-sm">
            <span className="mb-1 block text-[#667085]">配送資訊（選填）</span>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-[#E8E1D7] px-3 py-2.5 text-sm"
              value={form.delivery_info}
              onChange={(e) => patch({ delivery_info: e.target.value })}
              placeholder="例：送到台中市西屯區…／希望門市自取（朝馬門市）／需要冷鏈配送"
            />
          </label>
          <div className="mt-3">
            <span className="mb-1 block text-sm text-[#667085]">方便聯絡時間（選填）</span>
            <div className="mb-2 flex flex-wrap gap-2">
              {CONTACT_TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => patch({ preferred_contact_time: preset })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    form.preferred_contact_time === preset
                      ? "bg-[#153E73] text-white"
                      : "border border-[#E8E1D7] bg-white text-[#667085]"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              className="w-full rounded-xl border border-[#E8E1D7] px-3 py-2.5 text-sm"
              value={form.preferred_contact_time}
              onChange={(e) => patch({ preferred_contact_time: e.target.value })}
              placeholder="也可以自己填，例：週三下午 2 點後"
            />
          </div>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-[#667085]">其他需求說明（選填）</span>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-[#E8E1D7] px-3 py-2.5 text-sm"
              value={form.message}
              onChange={(e) => patch({ message: e.target.value })}
              placeholder="例：需要統一發票、預計使用日期、包裝要求…"
            />
          </label>
        </section>

        <div className="fixed inset-x-0 z-40 border-t border-[#E8E1D7] bg-white/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0"
          style={{ bottom: "calc(var(--bottom-nav-height, 5rem) + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto flex max-w-[900px] items-center gap-3">
            <p className="hidden flex-1 text-xs text-[#8A94A6] sm:block">
              送出後會進到客服的詢價管理，我們會以電話或 Email 回覆報價單。
            </p>
            <button
              type="submit"
              disabled={submitting || cart.items.length === 0}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#153E73] text-sm font-bold text-white disabled:opacity-40 sm:flex-none sm:px-8"
            >
              {submitting ? "送出中…" : "送出詢價單"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
