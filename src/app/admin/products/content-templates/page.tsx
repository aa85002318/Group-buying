"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PRODUCT_CONTENT_SECTIONS,
  PRODUCT_CONTENT_SECTION_LABELS,
  type ProductContentSection,
  type ProductContentTemplate,
} from "@/lib/admin/product-content-templates";

type Draft = {
  id?: string;
  name: string;
  template_key: string;
  section: ProductContentSection;
  body_html: string;
  sort_order: string;
  is_active: boolean;
};

const emptyDraft = (section: ProductContentSection): Draft => ({
  name: "",
  template_key: "",
  section,
  body_html: "",
  sort_order: "0",
  is_active: true,
});

export default function AdminProductContentTemplatesPage() {
  const [section, setSection] = useState<ProductContentSection>("rich_description");
  const [templates, setTemplates] = useState<ProductContentTemplate[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft("rich_description"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (sec: ProductContentSection) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/content-templates?section=${sec}&all=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(section);
    setDraft(emptyDraft(section));
    setMessage(null);
  }, [section, load]);

  const select = (t: ProductContentTemplate) => {
    setDraft({
      id: t.id,
      name: t.name,
      template_key: t.template_key,
      section: t.section,
      body_html: t.body_html,
      sort_order: String(t.sort_order ?? 0),
      is_active: t.is_active,
    });
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        name: draft.name,
        template_key: draft.template_key || undefined,
        section: draft.section,
        body_html: draft.body_html,
        sort_order: Number(draft.sort_order) || 0,
        is_active: draft.is_active,
      };
      const res = await fetch(
        draft.id
          ? `/api/admin/products/content-templates/${draft.id}`
          : "/api/admin/products/content-templates",
        {
          method: draft.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setMessage("已儲存");
      await load(section);
      if (data.template) select(data.template as ProductContentTemplate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!draft.id) return;
    if (!confirm("確定停用此公版？商品編輯處將不再顯示。")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/content-templates/${draft.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "停用失敗");
      setDraft(emptyDraft(section));
      setMessage("已停用");
      await load(section);
    } catch (e) {
      setError(e instanceof Error ? e.message : "停用失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="商品內容公版"
        description="管理「商品介紹／適合用途／商品規格」套用模板。配送注意事項請至配送說明公版。"
      />
      <p className="text-sm text-[#667085]">
        配送注意事項（全站）：{" "}
        <Link href="/admin/site-pages/shipping" className="text-[#153E73] underline">
          編輯配送說明公版
        </Link>
      </p>

      <div className="flex flex-wrap gap-2">
        {PRODUCT_CONTENT_SECTIONS.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setSection(sec)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              section === sec
                ? "bg-[#153E73] text-white"
                : "border border-gray-200 bg-white text-[#153E73]"
            }`}
          >
            {PRODUCT_CONTENT_SECTION_LABELS[sec]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-semibold text-[#153E73]">公版列表</h2>
            <Button type="button" size="sm" variant="secondary" onClick={() => setDraft(emptyDraft(section))}>
              新增
            </Button>
          </div>
          {loading ? (
            <p className="px-1 text-xs text-[#8A94A6]">載入中…</p>
          ) : templates.length === 0 ? (
            <p className="px-1 text-xs text-[#8A94A6]">尚無公版</p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => select(t)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  draft.id === t.id ? "bg-[#FFF5CC]" : "hover:bg-[#F7F1E7]"
                }`}
              >
                <span className="font-medium text-[#153E73]">{t.name}</span>
                {!t.is_active ? (
                  <span className="ml-2 text-[10px] text-[#F16458]">已停用</span>
                ) : null}
                <span className="mt-0.5 block text-[10px] text-[#8A94A6]">{t.template_key}</span>
              </button>
            ))
          )}
        </aside>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#153E73]">
            {draft.id ? "編輯公版" : "新增公版"} · {PRODUCT_CONTENT_SECTION_LABELS[section]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-[#667085]">名稱</span>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="例：烘焙材料介紹"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[#667085]">代碼（選填）</span>
              <Input
                value={draft.template_key}
                onChange={(e) => setDraft((d) => ({ ...d, template_key: e.target.value }))}
                placeholder="自動產生"
                disabled={Boolean(draft.id)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[#667085]">排序</span>
              <Input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
              />
              啟用（顯示於商品編輯「套用內容公版」）
            </label>
          </div>
          <AdminRichTextEditor
            value={draft.body_html}
            onChange={(body_html) => setDraft((d) => ({ ...d, body_html }))}
            placeholder="編輯公版 HTML 內容…"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "儲存中…" : "儲存公版"}
            </Button>
            {draft.id ? (
              <Button type="button" variant="outline" onClick={() => void deactivate()} disabled={saving}>
                停用
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={() => setDraft(emptyDraft(section))}>
              清除表單
            </Button>
          </div>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
