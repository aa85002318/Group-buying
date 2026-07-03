"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ORDER_PAYMENT_STATUS_LABELS, ORDER_PICKUP_STATUS_LABELS } from "@/lib/utils";

export function PickupQrCode({ orderId }: { orderId: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}/pickup-qr`)
      .then((r) => r.json())
      .then((d) => {
        if (d.qr_data_url) setQrDataUrl(d.qr_data_url);
        else setError(d.error ?? "無法產生取貨碼");
      })
      .catch(() => setError("載入失敗"));
  }, [orderId]);

  if (error) return <p className="text-center text-sm text-muted-foreground">{error}</p>;
  if (!qrDataUrl) return <p className="text-center text-sm text-muted-foreground">產生取貨 QR Code…</p>;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl bg-white p-3 shadow-card">
        <Image src={qrDataUrl} alt="取貨 QR Code" width={280} height={280} unoptimized />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        請於門市出示此 QR Code 取貨（不含個人資料）
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
