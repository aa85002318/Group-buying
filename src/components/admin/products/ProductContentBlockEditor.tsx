"use client";

import { useEffect, useState } from "react";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { Button } from "@/components/ui/button";
import type { ProductContentTemplate } from "@/lib/admin/product-content-templates";

const FALLBACK: Record<string, { label: string; html: string }[]> = {
  rich_description: [
    {
      label: "基本商品介紹",
      html: "<h2>商品特色</h2><p>請填寫商品重點說明。</p><h3>使用方式</h3><p></p>",
    },
    {
      label: "食品商品介紹",
      html: "<h2>商品介紹</h2><p></p><h3>保存方式</h3><p>請依包裝標示保存。</p><h3>注意事項</h3><p></p>",
    },
    {
      label: "烘焙材料介紹",
      html: "<h2>產品說明</h2><p></p><h3>規格</h3><p></p><h3>建議用法</h3><p></p>",
    },
  ],
  product_info: [
    { label: "適合用途（基本）", html: "<p>適合居家烘焙與日常料理使用。</p>" },
  ],
  specifications: [{ label: "商品規格（基本）", html: "<p>請見包裝標示。</p>" }],
};

export function ProductContentBlockEditor({
  title,
  section,
  value,
  onChange,
  footer,
}: {
  title: string;
  section: "rich_description" | "product_info" | "specifications";
  value: string;
  onChange: (html: string) => void;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<ProductContentTemplate[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/products/content-templates?section=${section}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setTemplates(Array.isArray(d.templates) ? d.templates : []);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  const options =
    templates.length > 0
      ? templates.map((t) => ({ label: t.name, html: t.body_html }))
      : FALLBACK[section] ?? [];

  const apply = (html: string) => {
    if (value.trim() && !confirm("目前已有內容，套用公版將取代現有內容。")) return;
    onChange(html);
    setOpen(false);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[#153E73]">{title}</h2>
        <div className="relative flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            套用內容公版
          </Button>
          {open ? (
            <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              {options.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#FFF5CC]"
                  onClick={() => apply(t.html)}
                >
                  {t.label}
                </button>
              ))}
              {options.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[#8A94A6]">尚無公版，請先至公版設定新增。</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <AdminRichTextEditor value={value} onChange={onChange} placeholder={`輸入${title}…`} />
      {footer}
    </section>
  );
}
