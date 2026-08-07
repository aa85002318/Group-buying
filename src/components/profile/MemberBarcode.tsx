"use client";

import { useEffect, useRef } from "react";

type MemberBarcodeProps = {
  value: string;
  title?: string;
  className?: string;
  height?: number;
};

/** 會員條碼（傳統 CODE128 線條條碼；內容為手機號碼） */
export function MemberBarcode({
  value,
  title = "會員條碼",
  className,
  height = 96,
}: MemberBarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!value || !svgRef.current) return;
    let cancelled = false;

    import("jsbarcode").then((mod) => {
      if (cancelled || !svgRef.current) return;
      const JsBarcode = mod.default;
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          displayValue: false,
          height,
          margin: 12,
          background: "#FFFFFF",
          lineColor: "#000000",
          width: 2,
        });
      } catch {
        // Invalid barcode value — leave empty
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value, height]);

  if (!value) return null;

  return (
    <div className={className}>
      {title ? (
        <p className="mb-2 text-center text-sm font-medium text-coffee">{title}</p>
      ) : null}
      <div className="mx-auto flex w-full max-w-sm flex-col items-center rounded-xl border border-border bg-white p-4 shadow-card">
        <svg
          ref={svgRef}
          role="img"
          aria-label="會員條碼"
          className="w-full max-w-[320px]"
        />
        <p className="mt-3 font-mono text-lg tracking-widest text-primary">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">門市掃描此條碼辨識會員（手機號碼）</p>
      </div>
    </div>
  );
}
