"use client";

import { useState } from "react";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { Button } from "@/components/ui/button";
import type { AdminProductFormV2 } from "@/lib/admin/product-form-v2";

const TEMPLATES: Record<string, { label: string; html: string }> = {
  basic: {
    label: "基本商品介紹",
    html: "<h2>商品特色</h2><p>請填寫商品重點說明。</p><h3>使用方式</h3><p></p>",
  },
  food: {
    label: "食品商品介紹",
    html: "<h2>商品介紹</h2><p></p><h3>保存方式</h3><p>請依包裝標示保存。</p><h3>注意事項</h3><p></p>",
  },
  baking: {
    label: "烘焙材料介紹",
    html: "<h2>產品說明</h2><p></p><h3>規格</h3><p></p><h3>建議用法</h3><p></p>",
  },
};

export function ProductDescription({
  form,
  patch,
}: {
  form: AdminProductFormV2;
  patch: (partial: Partial<AdminProductFormV2>) => void;
}) {
  const [open, setOpen] = useState(false);

  const apply = (html: string) => {
    if (form.rich_description.trim() && !confirm("目前商品介紹已有內容，套用模板將取代現有內容。")) return;
    patch({ rich_description: html });
    setOpen(false);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[#153E73]">③ 商品介紹</h2>
        <div className="relative">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            套用內容模板
          </Button>
          {open ? (
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#FFF5CC]"
                  onClick={() => apply(t.html)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <AdminRichTextEditor
        value={form.rich_description}
        onChange={(rich_description) => patch({ rich_description })}
        placeholder="輸入商品詳細介紹…"
      />
    </section>
  );
}
