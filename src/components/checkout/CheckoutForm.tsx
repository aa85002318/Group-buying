"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CHECKOUT_PAYMENT_OPTIONS,
  CHECKOUT_SHIPMENT_OPTIONS,
  shippingFeeForMethod,
} from "@/lib/checkout/options";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import type { PaymentGateway, ShipmentMethod, Store } from "@/lib/types/database";

function OptionCard({
  selected,
  disabled,
  title,
  description,
  hint,
  onSelect,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border bg-card",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-coffee">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {hint && <span className="shrink-0 text-xs text-primary">{hint}</span>}
      </div>
    </button>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentGateway>("store_cash");
  const [shipmentMethod, setShipmentMethod] = useState<ShipmentMethod>("store_pickup");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress] = useState("");
  const [cvsStoreId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loading: authLoading, emailVerified, email, resending, resendVerification } =
    useEmailVerification();

  async function handleResendVerification() {
    try {
      const message = await resendVerification(customerEmail || email);
      alert(message ?? "驗證信已寄出，請至信箱點擊連結完成驗證");
    } catch (e) {
      alert(e instanceof Error ? e.message : "寄送失敗");
    }
  }

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((storesRes) => {
        if (Array.isArray(storesRes.stores) && storesRes.stores.length > 0) {
          setStores(storesRes.stores);
          setStoreId(storesRes.stores[0].id);
        }
      })
      .catch(() => {});

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((meRes) => {
        if (meRes.profile) {
          setRecipientName(meRes.profile.full_name ?? "");
          setRecipientPhone(meRes.profile.phone ?? "");
        }
        if (meRes.user?.email) setCustomerEmail(meRes.user.email);
      })
      .catch(() => {});
  }, []);

  const shippingFee = useMemo(() => shippingFeeForMethod(shipmentMethod), [shipmentMethod]);
  const grandTotal = Math.max(0, total + shippingFee);

  async function submitOrder() {
    if (items.length === 0) return;
    if (emailVerified === false) {
      alert("請先完成 Email 驗證後再下單");
      return;
    }
    if (shipmentMethod === "store_pickup" && !storeId) {
      alert("請選擇取貨門市");
      return;
    }
    if (!recipientName.trim() || !recipientPhone.trim()) {
      alert("請填寫聯絡人姓名與電話");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.productId,
            quantity: i.quantity,
            group_buy_product_id: i.groupBuyProductId ?? undefined,
          })),
          store_id: storeId || undefined,
          payment_method: paymentMethod,
          shipment_method: shipmentMethod,
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          customer_email: customerEmail.trim() || undefined,
          shipping_address: shippingAddress.trim() || undefined,
          cvs_store_id: cvsStoreId.trim() || undefined,
          referral_code: referralCode.trim() || undefined,
          coupon_code: couponCode.trim() || undefined,
          notes: notes.trim() || undefined,
          shipping_fee: shippingFee,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "email_not_confirmed") {
          throw new Error("請先完成 Email 驗證後再下單");
        }
        throw new Error(data.error || "下單失敗");
      }
      clear();
      router.push(`/orders/${data.order.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "下單失敗");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">購物車是空的</p>
        <Link href="/products" className="text-sm text-primary hover:underline">
          前往選購
        </Link>
      </div>
    );
  }

  if (authLoading) {
    return <div className="py-12 text-center text-muted-foreground">載入中...</div>;
  }

  if (emailVerified === false) {
    return (
      <div className="space-y-4 py-8">
        <h1 className="text-xl font-bold text-coffee">結帳</h1>
        <EmailVerificationNotice
          email={customerEmail || email}
          resending={resending}
          onResend={handleResendVerification}
        />
        <Link href="/cart" className="block text-center text-sm text-primary hover:underline">
          返回購物車
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <Link href="/cart" className="text-sm text-primary hover:underline">
        ← 返回購物車
      </Link>
      <h1 className="text-xl font-bold text-coffee">結帳</h1>

      <Card>
        <CardContent className="space-y-2 p-4">
          <h2 className="font-medium text-coffee">訂單明細</h2>
          {items.map((item) => (
            <div key={`${item.productId}-${item.groupBuyProductId ?? ""}`} className="flex justify-between text-sm">
              <span className="line-clamp-1 pr-2">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="space-y-1 border-t border-border pt-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>商品小計</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>運費</span>
              <span>{shippingFee === 0 ? "免運" : formatCurrency(shippingFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>應付金額</span>
              <span className="text-promo">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-medium text-coffee">配送方式</h2>
        {CHECKOUT_SHIPMENT_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            selected={shipmentMethod === opt.value}
            disabled={!opt.enabled}
            title={opt.label}
            description={opt.description}
            hint={opt.feeHint}
            onSelect={() => setShipmentMethod(opt.value)}
          />
        ))}

        {shipmentMethod === "store_pickup" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">取貨門市</label>
            <select
              className="input-field w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              disabled={stores.length === 0}
            >
              {stores.length === 0 ? (
                <option value="">尚無門市資料</option>
              ) : (
                stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
            {(() => {
              const store = stores.find((s) => s.id === storeId);
              if (!store) return null;
              return (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                  <p className="text-muted-foreground">地址：{store.address}</p>
                  {store.phone && <p className="text-muted-foreground">電話：{store.phone}</p>}
                  <div className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-amber-950">
                    <p className="text-xs font-medium">注意事項</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-xs">
                      {store.notes?.trim() || "請於營業時間內取貨。"}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-coffee">付款方式</h2>
        {CHECKOUT_PAYMENT_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            selected={paymentMethod === opt.value}
            disabled={!opt.enabled}
            title={opt.label}
            description={opt.description}
            onSelect={() => setPaymentMethod(opt.value)}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-coffee">聯絡資訊</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium">聯絡人姓名</label>
          <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="收件人姓名" required />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">聯絡電話</label>
          <Input type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="手機號碼" required />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Email</label>
          <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="聯絡信箱" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-coffee">其他（選填）</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium">優惠碼</label>
          <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="輸入優惠碼" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">推薦碼</label>
          <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="輸入推薦碼" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">訂單備註</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="特殊需求、取貨時間等" />
        </div>
      </section>

      <Button
        className="w-full"
        size="lg"
        variant="promo"
        onClick={submitOrder}
        disabled={submitting || emailVerified !== true || (shipmentMethod === "store_pickup" && !storeId)}
      >
        {submitting ? "建立訂單中..." : `確認下單 ${formatCurrency(grandTotal)}`}
      </Button>
    </div>
  );
}

export function CheckoutFormWithSuspense() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-muted-foreground">載入中...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
