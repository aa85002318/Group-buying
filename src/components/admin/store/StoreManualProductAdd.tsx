"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BarcodeProduct } from "@/components/admin/store/AdminBarcodeInput";

type Props = {
  onCreated: (product: BarcodeProduct) => void;
  initialBarcode?: string;
};

/** Quick-add product into Product Master when barcode miss. */
export function StoreManualProductAdd({ onCreated, initialBarcode = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState(initialBarcode);
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("件");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) {
      setError("請填寫商品名稱");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          barcode: barcode.trim() || null,
          sku: sku.trim() || null,
          unit: unit.trim() || null,
          status: "active",
          publish_store: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      const p = data.product as BarcodeProduct;
      onCreated({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        unit: p.unit,
        matched_via: "manual_create",
      });
      setOpen(false);
      setName("");
      setBarcode("");
      setSku("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs font-semibold text-[#153E73] underline"
        onClick={() => setOpen(true)}
      >
        無建檔？手動新增商品並寫入商品資料庫
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-[#FFE149] bg-[#FFFBEA] p-3">
      <p className="text-sm font-semibold text-[#153E73]">手動新增商品</p>
      <p className="text-[11px] text-muted-foreground">
        會寫入共用 products 主檔，之後條碼即可查到。
      </p>
      <Input
        className="h-10 rounded-xl"
        placeholder="商品名稱（必填）"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          className="h-10 rounded-xl"
          placeholder="條碼"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <Input
          className="h-10 rounded-xl"
          placeholder="SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        />
      </div>
      <Input
        className="h-10 rounded-xl"
        placeholder="單位（例如 件／包）"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={saving}
          className="border-[#FFE149] bg-[#FFE149] text-[#153E73]"
          onClick={() => void save()}
        >
          {saving ? "儲存中…" : "新增並選用"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          取消
        </Button>
      </div>
    </div>
  );
}
