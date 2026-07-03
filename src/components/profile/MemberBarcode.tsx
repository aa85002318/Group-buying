"use client";

import { useEffect, useState } from "react";

type MemberBarcodeProps = {
  value: string;
  title?: string;
  className?: string;
};

/** 會員條碼（QR 內容為手機號碼／會員碼） */
export function MemberBarcode({ value, title = "會員條碼", className }: MemberBarcodeProps) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!value) {
      setDataUrl("");
      return;
    }
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(value, {
        width: 220,
        margin: 1,
        errorCorrectionLevel: "M",
      }).then((url) => {
        if (!cancelled) setDataUrl(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!value) return null;

  return (
    <div className={className}>
      <p className="mb-2 text-center text-sm font-medium text-coffee">{title}</p>
      <div className="mx-auto flex w-fit flex-col items-center rounded-xl border border-border bg-white p-4 shadow-card">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`會員條碼 ${value}`} width={220} height={220} className="h-auto w-[220px]" />
        ) : (
          <div className="flex h-[220px] w-[220px] items-center justify-center text-sm text-muted-foreground">
            產生中…
          </div>
        )}
        <p className="mt-3 font-mono text-lg tracking-wide text-primary">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">門市掃描此條碼辨識會員</p>
      </div>
    </div>
  );
}
