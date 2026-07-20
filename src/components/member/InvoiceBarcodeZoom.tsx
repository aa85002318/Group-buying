"use client";

import { useEffect, useRef } from "react";
import { Copy, X } from "lucide-react";
import { InvoiceBarcode } from "@/components/member/InvoiceBarcode";
import { Button } from "@/components/ui/button";

type InvoiceBarcodeZoomProps = {
  open: boolean;
  value: string;
  onClose: () => void;
  onCopy?: () => void;
};

export function InvoiceBarcodeZoom({ open, value, onClose, onCopy }: InvoiceBarcodeZoomProps) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!open) {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      return;
    }

    let cancelled = false;
    if ("wakeLock" in navigator) {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          if (cancelled) {
            lock.release().catch(() => {});
            return;
          }
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-surface"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-modal="true"
      aria-label="放大條碼"
    >
      <div className="flex items-center justify-end gap-2 p-4">
        {onCopy && (
          <Button type="button" variant="outline" size="sm" onClick={onCopy}>
            <Copy className="mr-1 h-4 w-4" />
            複製條碼
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={onClose} aria-label="關閉">
          <X className="mr-1 h-4 w-4" />
          關閉
        </Button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <InvoiceBarcode value={value} height={120} className="w-full max-w-sm" />
        <p className="mt-4 font-mono text-lg tracking-wider text-foreground">{value}</p>
        <p className="mt-4 text-center text-sm text-foreground-secondary">請將螢幕亮度調高後出示</p>
      </div>
    </div>
  );
}
