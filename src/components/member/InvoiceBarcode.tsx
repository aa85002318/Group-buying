"use client";

import { useEffect, useRef } from "react";

type InvoiceBarcodeProps = {
  value: string;
  className?: string;
  height?: number;
};

/** CODE128 SVG barcode for Taiwan mobile invoice carrier */
export function InvoiceBarcode({ value, className, height = 80 }: InvoiceBarcodeProps) {
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
      <svg ref={svgRef} role="img" aria-label="發票手機條碼" className="w-full max-w-[320px]" />
      <p className="mt-3 text-center font-mono text-lg tracking-widest text-[#202124]">{value}</p>
    </div>
  );
}
