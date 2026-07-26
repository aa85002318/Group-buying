"use client";

import { useEffect, useRef } from "react";
import {
  formatPriceTwd,
  formatWeight,
  resolveLabelPrice,
  type LabelTemplateConfig,
  type PrintQueueItem,
} from "@/lib/admin/product-labels";
import { cn } from "@/lib/utils";

type LabelPreviewCardProps = {
  item: PrintQueueItem;
  template: LabelTemplateConfig;
  className?: string;
  /** When true, use absolute mm for print sheet */
  forPrint?: boolean;
};

function LabelBarcode({
  value,
  type,
  height = 28,
}: {
  value: string;
  type: LabelTemplateConfig["barcode_type"];
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;

    if (type === "QR") {
      import("qrcode").then((QRCode) => {
        if (cancelled || !canvasRef.current) return;
        QRCode.toCanvas(canvasRef.current, value, {
          width: 56,
          margin: 0,
          color: { dark: "#000000", light: "#FFFFFF" },
        }).catch(() => {});
      });
      return () => {
        cancelled = true;
      };
    }

    import("jsbarcode").then((mod) => {
      if (cancelled || !svgRef.current) return;
      const JsBarcode = mod.default;
      try {
        const format = type === "EAN13" && /^\d{12,13}$/.test(value) ? "EAN13" : "CODE128";
        JsBarcode(svgRef.current, value, {
          format,
          displayValue: false,
          height,
          margin: 0,
          background: "#FFFFFF",
          lineColor: "#000000",
          width: 1.2,
        });
      } catch {
        // invalid
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value, type, height]);

  if (!value) return null;
  if (type === "QR") {
    return <canvas ref={canvasRef} className="mx-auto" width={56} height={56} />;
  }
  return <svg ref={svgRef} className="mx-auto h-auto max-h-8 w-full" />;
}

export function LabelPreviewCard({
  item,
  template,
  className,
  forPrint = false,
}: LabelPreviewCardProps) {
  const { product, priceSource, customPrice, promoText } = item;
  const resolved = resolveLabelPrice(product, priceSource, customPrice);
  const weight = formatWeight(product.weight_grams, product.unit);
  const promo = promoText ?? template.promo_text ?? null;
  const style = template.style_variant;

  const priceWeight =
    template.price_font_weight === "black"
      ? 900
      : template.price_font_weight === "bold"
        ? 700
        : 400;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden border border-neutral-800 bg-white text-black",
        forPrint ? "break-inside-avoid" : "shadow-sm",
        className
      )}
      style={
        forPrint
          ? {
              width: `${template.width_mm}mm`,
              height: `${template.height_mm}mm`,
              padding: "1.5mm",
              boxSizing: "border-box",
            }
          : {
              aspectRatio: `${template.width_mm} / ${template.height_mm}`,
              padding: "8px",
            }
      }
    >
      {template.show_logo && (
        <p className="mb-0.5 text-[8px] font-bold tracking-wide text-neutral-500">CHIMEIDIY</p>
      )}

      {template.show_promo_text && promo && (
        <p
          className={cn(
            "mb-0.5 font-black uppercase leading-none",
            style === "sale" && "text-red-600",
            style === "vip" && "text-amber-700",
            style === "wholesale" && "text-neutral-700"
          )}
          style={{ fontSize: `${Math.max(9, template.name_font_size - 2)}pt` }}
        >
          {promo}
        </p>
      )}

      {template.show_brand && product.brand_name && (
        <p className="truncate text-[9px] text-neutral-500">{product.brand_name}</p>
      )}

      {template.show_name && (
        <p
          className="leading-tight"
          style={{
            fontSize: `${template.name_font_size}pt`,
            fontWeight: 700,
            display: "-webkit-box",
            WebkitLineClamp: style === "minimal" ? 1 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </p>
      )}

      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-neutral-600">
        {template.show_spec && product.specifications && (
          <span style={{ fontSize: `${Math.max(8, template.barcode_font_size)}pt` }}>
            {product.specifications}
          </span>
        )}
        {template.show_weight && weight && (
          <span style={{ fontSize: `${Math.max(8, template.barcode_font_size)}pt` }}>{weight}</span>
        )}
        {template.show_sku && product.sku && (
          <span style={{ fontSize: `${Math.max(8, template.barcode_font_size - 1)}pt` }}>
            SKU {product.sku}
          </span>
        )}
        {template.show_origin && product.origin && (
          <span style={{ fontSize: `${Math.max(8, template.barcode_font_size)}pt` }}>
            {product.origin}
          </span>
        )}
      </div>

      {template.show_price && (
        <div className="mt-auto flex items-end gap-2">
          {(style === "sale" || style === "vip") && resolved.comparePrice != null && (
            <span
              className="text-neutral-400 line-through"
              style={{ fontSize: `${Math.max(9, template.price_font_size * 0.4)}pt` }}
            >
              {formatPriceTwd(resolved.comparePrice)}
            </span>
          )}
          <span
            className={cn("leading-none", style === "sale" && "text-red-600")}
            style={{
              fontSize: `${template.price_font_size}pt`,
              fontWeight: priceWeight,
            }}
          >
            {formatPriceTwd(resolved.price)}
          </span>
          {style === "vip" && (
            <span className="mb-0.5 text-[9px] font-semibold text-amber-700">會員</span>
          )}
        </div>
      )}

      {template.show_barcode && product.barcode && (
        <div className="mt-1">
          <LabelBarcode
            value={product.barcode}
            type={template.barcode_type}
            height={Math.max(18, Math.round(template.height_mm * 0.7))}
          />
          <p
            className="mt-0.5 text-center font-mono tracking-wider text-neutral-700"
            style={{ fontSize: `${template.barcode_font_size}pt` }}
          >
            {product.barcode}
          </p>
        </div>
      )}

      {template.show_qrcode && (product.barcode || product.sku || product.id) && (
        <div className="mt-1 flex justify-end">
          <LabelBarcode
            value={product.barcode || product.sku || product.id}
            type="QR"
          />
        </div>
      )}
    </div>
  );
}

type LabelPrintSheetProps = {
  items: PrintQueueItem[];
  template: LabelTemplateConfig;
  paperMode: "label" | "a4";
};

/** Hidden print-only sheet rendered for window.print() */
export function LabelPrintSheet({ items, template, paperMode }: LabelPrintSheetProps) {
  const gap = 2;
  const pageW = paperMode === "a4" ? 210 : template.width_mm;
  const cols =
    paperMode === "a4"
      ? Math.max(1, Math.floor((pageW - 10) / (template.width_mm + gap)))
      : 1;

  return (
    <div className="label-print-root hidden print:block">
      <style>{`
        @media print {
          @page {
            size: ${paperMode === "a4" ? "A4" : `${template.width_mm}mm ${template.height_mm}mm`};
            margin: ${paperMode === "a4" ? "5mm" : "0"};
          }
          body * { visibility: hidden !important; }
          .label-print-root, .label-print-root * { visibility: visible !important; }
          .label-print-root {
            position: absolute !important;
            left: 0; top: 0; width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${template.width_mm}mm)`,
          gap: `${gap}mm`,
          justifyContent: paperMode === "a4" ? "start" : "center",
        }}
      >
        {items.map((item, idx) => (
          <LabelPreviewCard
            key={`${item.product.id}-${idx}`}
            item={item}
            template={template}
            forPrint
          />
        ))}
      </div>
      {paperMode === "label" && items.length === 0 && (
        <p className="p-4 text-sm">無可列印標籤</p>
      )}
    </div>
  );
}
