"use client";

import { X } from "lucide-react";
import { InvoiceBarcode } from "@/components/member/InvoiceBarcode";
import { Button } from "@/components/ui/button";

type InvoiceBarcodeZoomProps = {
  open: boolean;
  value: string;
  onClose: () => void;
};

export function InvoiceBarcodeZoom({ open, value, onClose }: InvoiceBarcodeZoomProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-modal="true"
      aria-label="放大條碼"
    >
      <div className="flex items-center justify-end p-4">
        <Button type="button" variant="outline" size="sm" onClick={onClose} aria-label="關閉">
          <X className="mr-1 h-4 w-4" />
          關閉
        </Button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <InvoiceBarcode value={value} height={120} className="w-full max-w-sm" />
        <p className="mt-6 text-center text-sm text-[#6B7280]">請將螢幕亮度調高後出示</p>
      </div>
    </div>
  );
}
