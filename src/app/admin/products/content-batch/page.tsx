"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { Button } from "@/components/ui/button";
import { PRODUCT_CONTENT_SECTION_LABELS, type ProductContentSection } from "@/lib/admin/product-content-templates";
import { cn } from "@/lib/utils";

type ContentProduct = {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  rich_description: string;
  product_info: string;
  specifications: string;
};

type FieldKey = "name" | "rich_description" | "product_info" | "specifications";

const FIELDS: Array<{
  key: FieldKey;
  label: string;
  section?: ProductContentSection;
  plain?: boolean;
}> = [
  { key: "name", label: "名稱", plain: true },
  { key: "rich_description", section: "rich_description", label: "特色" },
  { key: "product_info", section: "product_info", label: "用途" },
  { key: "specifications", section: "specifications", label: "規格" },
];

type DraftRow = {
  name: string;
  rich_description: string;
  product_info: string;
  specifications: string;
};

type DraftMap = Record<string, DraftRow>;

type TemplateOpt = { id: string; name: string; body_html: string };

export default function AdminProductContentBatchPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#8A94A6]">載入中…</p>}>
      <AdminProductContentBatchInner />
    </Suspense>
  );
}

function AdminProductContentBatchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";

  const initialIds = useMemo(
    () =>
      idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [idsParam]
  );

  const [products, setProducts] = useState<ContentProduct[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [dirty, setDirty] = useState<Record<string, Partial<Record<FieldKey, boolean>>>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [field, setField] = useState<FieldKey>("name");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState("");
  const [templates, setTemplates] = useState<TemplateOpt[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [previewSummary, setPreviewSummary] = useState<{
    total: number;
    executableCount: number;
    errorCount: number;
    items: Array<{ productId: string; name: string; ok: boolean; errors: string[] }>;
  } | null>(null);

  const load = useCallback(async (ids: string[]) => {
    if (!ids.length) {
      setProducts([]);
      setDrafts({});
      setActiveId(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/content-batch/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      const list = (data.products ?? []) as ContentProduct[];
      setProducts(list);
      const nextDrafts: DraftMap = {};
      for (const p of list) {
        nextDrafts[p.id] = {
          name: p.name ?? "",
          rich_description: p.rich_description ?? "",
          product_info: p.product_info ?? "",
          specifications: p.specifications ?? "",
        };
      }
      setDrafts(nextDrafts);
      setDirty({});
      setActiveId((prev) => (prev && list.some((p) => p.id === prev) ? prev : list[0]?.id ?? null));
      setPreviewSummary(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(initialIds);
  }, [initialIds, load]);

  const activeFieldMeta = FIELDS.find((f) => f.key === field);
  const section = activeFieldMeta?.section ?? "rich_description";
  const isPlainName = field === "name";

  useEffect(() => {
    if (isPlainName) {
      setTemplates([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/admin/products/content-templates?section=${section}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setTemplates(
          (d.templates ?? []).map((t: { id: string; name: string; body_html: string }) => ({
            id: t.id,
            name: t.name,
            body_html: t.body_html,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [section, isPlainName]);

  const active = products.find((p) => p.id === activeId) ?? null;
  const activeDraft = activeId ? drafts[activeId] : null;

  const filteredProducts = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const draftName = drafts[p.id]?.name ?? p.name;
      return (
        draftName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, listQuery, drafts]);

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const id of Object.keys(dirty)) {
      const flags = dirty[id];
      if (flags?.name || flags?.rich_description || flags?.product_info || flags?.specifications) {
        n += 1;
      }
    }
    return n;
  }, [dirty]);

  const emptyDraft = (): DraftRow => ({
    name: "",
    rich_description: "",
    product_info: "",
    specifications: "",
  });

  const setFieldValue = (value: string) => {
    if (!activeId) return;
    setDrafts((prev) => ({
      ...prev,
      [activeId]: {
        ...emptyDraft(),
        ...prev[activeId],
        [field]: value,
      },
    }));
    setDirty((prev) => ({
      ...prev,
      [activeId]: { ...prev[activeId], [field]: true },
    }));
    setPreviewSummary(null);
    setMessage(null);
  };

  const applyTemplate = (html: string) => {
    if (!activeId || isPlainName) return;
    const current = activeDraft?.[field] ?? "";
    if (current.trim() && !confirm("目前欄位已有內容，套用公版將取代現有內容。")) return;
    setFieldValue(html);
    setTplOpen(false);
  };

  const applyFieldToAll = () => {
    if (!activeId || !activeDraft) return;
    const value = activeDraft[field];
    const label = FIELDS.find((f) => f.key === field)?.label ?? field;
    if (
      !confirm(
        `將目前「${label}」內容覆寫到全部 ${products.length} 個已選商品？此動作會標記所有商品為待儲存。`
      )
    ) {
      return;
    }
    setDrafts((prev) => {
      const next = { ...prev };
      for (const p of products) {
        next[p.id] = {
          ...emptyDraft(),
          ...next[p.id],
          [field]: value,
        };
      }
      return next;
    });
    setDirty((prev) => {
      const next = { ...prev };
      for (const p of products) {
        next[p.id] = { ...next[p.id], [field]: true };
      }
      return next;
    });
    setPreviewSummary(null);
    setMessage(`已將「${label}」套用到 ${products.length} 個商品（尚未儲存）`);
  };

  const removeProduct = (id: string) => {
    const nextIds = products.filter((p) => p.id !== id).map((p) => p.id);
    const qs = nextIds.length ? `?ids=${nextIds.join(",")}` : "";
    router.replace(`/admin/products/content-batch${qs}`);
  };

  const buildItems = () => {
    const items: Array<{
      productId: string;
      name?: string;
      rich_description?: string | null;
      product_info?: string | null;
      specifications?: string | null;
    }> = [];
    for (const p of products) {
      const flags = dirty[p.id];
      if (!flags) continue;
      const d = drafts[p.id];
      if (!d) continue;
      const item: (typeof items)[number] = { productId: p.id };
      let has = false;
      if (flags.name) {
        item.name = d.name;
        has = true;
      }
      if (flags.rich_description) {
        item.rich_description = d.rich_description;
        has = true;
      }
      if (flags.product_info) {
        item.product_info = d.product_info;
        has = true;
      }
      if (flags.specifications) {
        item.specifications = d.specifications;
        has = true;
      }
      if (has) items.push(item);
    }
    return items;
  };

  const runPreview = async () => {
    const items = buildItems();
    if (!items.length) {
      setError("沒有待儲存的變更，請先編輯內容");
      return;
    }
    setPreviewing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products/content-batch/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "預覽失敗");
      setPreviewSummary(data.preview);
      setMessage(`預覽完成：可執行 ${data.preview.executableCount}／共 ${data.preview.total}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "預覽失敗");
    } finally {
      setPreviewing(false);
    }
  };

  const runExecute = async () => {
    const items = buildItems();
    if (!items.length) {
      setError("沒有待儲存的變更");
      return;
    }
    if (!confirm(`確定寫入 ${items.length} 個商品的內容變更？可於批次紀錄復原。`)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products/content-batch/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, runMode: "all_or_nothing" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.preview) setPreviewSummary(data.preview);
        throw new Error(data.error ?? "儲存失敗");
      }
      setMessage(`已儲存 ${data.success} 筆。`);
      setDirty({});
      setPreviewSummary(data.preview ?? null);
      if (data.jobId) {
        router.push(`/admin/products/batch-history?job=${data.jobId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="內容批次編輯"
        description="一次整理多個商品的名稱、特色、適合用途、商品規格；富文字欄位支援樣式與內容公版。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products">
              <Button variant="outline">返回商品總覽</Button>
            </Link>
            <Link href="/admin/products/content-templates">
              <Button variant="secondary">內容公版</Button>
            </Link>
            <Link href="/admin/products/batch-history">
              <Button variant="ghost">批次紀錄</Button>
            </Link>
          </div>
        }
      />

      {!initialIds.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-[#667085]">
          請先到{" "}
          <Link href="/admin/products" className="font-medium text-[#153E73] underline">
            商品總覽
          </Link>{" "}
          勾選商品，再按「批次編輯內容」。
        </div>
      ) : null}

      {loading ? <p className="text-sm text-[#8A94A6]">載入中…</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      {products.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold text-[#153E73]">已選 {products.length} 件</h2>
              <span className="text-[11px] text-[#8A94A6]">待儲存 {dirtyCount}</span>
            </div>
            <input
              className="input-field h-9 w-full text-sm"
              placeholder="搜尋名稱／SKU"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
            />
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {filteredProducts.map((p) => {
                const isDirty = Boolean(
                  dirty[p.id]?.name ||
                    dirty[p.id]?.rich_description ||
                    dirty[p.id]?.product_info ||
                    dirty[p.id]?.specifications
                );
                const displayName = drafts[p.id]?.name || p.name;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-start gap-1 rounded-lg px-2 py-2",
                      activeId === p.id ? "bg-[#FFF5CC]" : "hover:bg-[#F7F1E7]"
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setActiveId(p.id)}
                    >
                      <span className="block truncate text-sm font-medium text-[#153E73]">
                        {displayName}
                        {isDirty ? <span className="ml-1 text-[#F16458]">•</span> : null}
                      </span>
                      <span className="block truncate text-[10px] text-[#8A94A6]">
                        {p.sku || "無 SKU"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="shrink-0 px-1 text-xs text-[#8A94A6] hover:text-[#F16458]"
                      onClick={() => removeProduct(p.id)}
                      title="移出清單"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            {active && activeDraft ? (
              <>
                <div>
                  <h2 className="text-base font-semibold text-[#153E73]">
                    {activeDraft.name || active.name}
                  </h2>
                  <p className="text-xs text-[#8A94A6]">
                    {active.sku || "無 SKU"} · {active.status}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {FIELDS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setField(f.key);
                        setTplOpen(false);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm",
                        field === f.key
                          ? "bg-[#153E73] text-white"
                          : "border border-gray-200 bg-white text-[#153E73]"
                      )}
                    >
                      {f.label}
                      {dirty[active.id]?.[f.key] ? " *" : ""}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isPlainName ? (
                    <div className="relative">
                      <Button type="button" size="sm" variant="outline" onClick={() => setTplOpen((v) => !v)}>
                        套用內容公版
                      </Button>
                      {tplOpen ? (
                        <div className="absolute left-0 z-20 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                          {templates.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-[#8A94A6]">
                              尚無公版，請至內容公版新增。
                            </p>
                          ) : (
                            templates.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#FFF5CC]"
                                onClick={() => applyTemplate(t.body_html)}
                              >
                                {t.name}
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <Button type="button" size="sm" variant="secondary" onClick={applyFieldToAll}>
                    將此欄位套用到全部勾選
                  </Button>
                  <span className="text-xs text-[#8A94A6]">
                    編輯中：
                    {isPlainName ? "名稱" : PRODUCT_CONTENT_SECTION_LABELS[section]}
                  </span>
                </div>

                {isPlainName ? (
                  <input
                    className="input-field w-full text-base"
                    value={activeDraft.name}
                    onChange={(e) => setFieldValue(e.target.value)}
                    placeholder="輸入商品名稱…"
                  />
                ) : (
                  <AdminRichTextEditor
                    value={activeDraft[field]}
                    onChange={setFieldValue}
                    placeholder={`輸入${FIELDS.find((f) => f.key === field)?.label}…`}
                  />
                )}

                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => void runPreview()} disabled={previewing || dirtyCount === 0}>
                    {previewing ? "預覽中…" : "預覽變更"}
                  </Button>
                  <Button type="button" onClick={() => void runExecute()} disabled={saving || dirtyCount === 0}>
                    {saving ? "儲存中…" : `儲存變更（${dirtyCount}）`}
                  </Button>
                </div>

                {previewSummary ? (
                  <div className="rounded-xl bg-[#FFFEFA] p-3 text-sm">
                    <p className="font-medium text-[#153E73]">
                      預覽：可執行 {previewSummary.executableCount}／錯誤 {previewSummary.errorCount}
                    </p>
                    <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-[#667085]">
                      {previewSummary.items.map((it) => (
                        <li key={it.productId}>
                          {it.name}
                          {it.ok ? " ✅" : ` ❌ ${it.errors.join("；")}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-[#8A94A6]">請從左側選擇商品。</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
