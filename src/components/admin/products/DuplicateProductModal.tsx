"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type DuplicateOptions = {
  categories: boolean;
  shipping: boolean;
  content: boolean;
  seo: boolean;
  variants: boolean;
  name: boolean;
  sku: boolean;
  price: boolean;
  images: boolean;
  stock: boolean;
};

const DEFAULT_OPTS: DuplicateOptions = {
  categories: true,
  shipping: true,
  content: true,
  seo: true,
  variants: true,
  name: false,
  sku: false,
  price: false,
  images: false,
  stock: false,
};

export function DuplicateProductModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (opts: DuplicateOptions) => void;
}) {
  const [opts, setOpts] = useState<DuplicateOptions>(DEFAULT_OPTS);
  if (!open) return null;
  const toggle = (key: keyof DuplicateOptions) => setOpts((o) => ({ ...o, [key]: !o[key] }));
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#153E73]">選擇要複製的內容</h3>
        <div className="mt-3 grid gap-2 text-sm">
          {(
            [
              ["categories", "商品分類"],
              ["shipping", "配送方式"],
              ["content", "商品內容"],
              ["seo", "SEO"],
              ["variants", "商品規格"],
              ["name", "商品名稱"],
              ["sku", "SKU"],
              ["price", "商品價格"],
              ["images", "商品圖片"],
              ["stock", "庫存"],
            ] as Array<[keyof DuplicateOptions, string]>
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={opts[key]} onChange={() => toggle(key)} />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" className="bg-[#153E73] text-white" onClick={() => onConfirm(opts)}>
            建立副本
          </Button>
        </div>
      </div>
    </div>
  );
}
