"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ORDER_PAYMENT_STATUS_LABELS, ORDER_PICKUP_STATUS_LABELS } from "@/lib/utils";

export function PickupQrCode({ orderId }: { orderId: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}/pickup-qr`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "無法產生取貨碼");
        if (d.qr_data_url) setQrDataUrl(d.qr_data_url);
        setPin(d.pin ?? null);
        setExpiresAt(d.expires_at ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"));
  }, [orderId]);

  if (error) return <p className="text-center text-sm text-muted-foreground">{error}</p>;
  if (!qrDataUrl) return <p className="text-center text-sm text-muted-foreground">產生取貨 QR Code…</p>;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl bg-white p-3 shadow-card">
        <Image src={qrDataUrl} alt="取貨 QR Code" width={280} height={280} unoptimized />
      </div>
      {pin ? (
        <p className="text-center text-2xl font-black tracking-[0.35em] text-[#153E73]">{pin}</p>
      ) : null}
      {expiresAt ? (
        <p className="text-center text-xs text-muted-foreground">
          最晚取貨：{new Date(expiresAt).toLocaleDateString("zh-TW")}
        </p>
      ) : null}
      <p className="text-center text-xs text-muted-foreground">
        請於門市出示 QR Code 或 6 位取貨碼。核銷後立即失效。
      </p>
    </div>
  );
}

export function OrderStatusBadges({
  paymentStatus,
  pickupStatus,
}: {
  paymentStatus?: string;
  pickupStatus?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {paymentStatus && (
        <span className="rounded-full bg-muted px-3 py-1">
          付款：{ORDER_PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
        </span>
      )}
      {pickupStatus && (
        <span className="rounded-full bg-muted px-3 py-1">
          取貨：{ORDER_PICKUP_STATUS_LABELS[pickupStatus] ?? pickupStatus}
        </span>
      )}
    </div>
  );
}
