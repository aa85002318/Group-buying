"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ScanBarcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type BarcodeProduct = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  image_url?: string | null;
  unit?: string | null;
  specifications?: string | null;
  package_spec?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  category_id?: string | null;
  cost_price?: number | null;
  stock?: number | null;
  nearest_expiry?: string | null;
  batch_qty?: number | null;
  matched_via?: string;
};

type AdminBarcodeInputProps = {
  onSelect: (product: BarcodeProduct) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function AdminBarcodeInput({
  onSelect,
  placeholder = "掃描或輸入條碼／SKU",
  autoFocus,
}: AdminBarcodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hit, setHit] = useState<BarcodeProduct | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const lookup = async (raw?: string) => {
    const q = (raw ?? code).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setHit(null);
    try {
      const res = await fetch(`/api/admin/store/barcode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      if (!data.product) {
        setError("找不到商品，可至商品資料庫快速新增");
        return;
      }
      setHit(data.product as BarcodeProduct);
      onSelect(data.product as BarcodeProduct);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-3 rounded-[16px] border border-[#E9DED4] bg-[#FFF8F5] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#6F4E37]">
        <ScanBarcode className="h-4 w-4" />
        條碼查詢
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void lookup();
            }
          }}
          placeholder={placeholder}
          className="rounded-[10px]"
        />
        <Button type="button" onClick={() => void lookup()} disabled={loading || !code.trim()}>
          {loading ? "查詢中…" : "查詢"}
        </Button>
      </div>
      <p className="text-xs text-[#756B64]">
        支援 USB 條碼槍（掃完自動 Enter）、手動輸入；手機相機掃描請使用系統相機／瀏覽器擴充。
      </p>
      {error ? <p className="text-sm text-[#C94C4C]">{error}</p> : null}
      {hit ? (
        <div className="flex gap-3 rounded-[12px] border border-[#E9DED4] bg-white p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#FAF6F1]">
            {hit.image_url ? (
              <Image src={hit.image_url} alt={hit.name} fill className="object-contain" sizes="56px" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#2F2925]">{hit.name}</p>
            <p className="text-xs text-[#756B64]">
              {hit.sku ? `SKU ${hit.sku}` : ""}
              {hit.barcode ? ` · 條碼 ${hit.barcode}` : ""}
              {hit.nearest_expiry ? ` · 最近效期 ${hit.nearest_expiry}` : ""}
              {hit.batch_qty != null ? ` · 批次庫存 ${hit.batch_qty}` : ""}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
