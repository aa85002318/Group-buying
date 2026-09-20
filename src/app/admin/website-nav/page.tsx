"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CmsLinkPicker,
  cmsLinkFromHref,
  hrefFromCmsLink,
} from "@/components/admin/home/CmsLinkPicker";
import {
  WEBSITE_NAV_MAX_ITEMS,
  newNavId,
  type WebsiteNavChild,
  type WebsiteNavItem,
} from "@/lib/site-nav";
import { GROUP_BUY_CONSUMER_VISIBLE } from "@/lib/features/group-buy-visibility";

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function LinkField({ href, onChange }: { href: string; onChange: (href: string) => void }) {
  return (
    <div className="space-y-1">
      <CmsLinkPicker value={cmsLinkFromHref(href)} onChange={(v) => onChange(hrefFromCmsLink(v))} />
      <Input
        value={href}
        placeholder="/shop 或 https://…"
        onChange={(e) => onChange(e.target.value)}
        className="h-9 font-mono text-xs"
      />
    </div>
  );
}

export default function AdminWebsiteNavPage() {
  const [items, setItems] = useState<WebsiteNavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/website-nav")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setMessage({ ok: false, text: "讀取失敗，請重新整理" }))
      .finally(() => {
        setLoading(false);
        setDirty(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (next: WebsiteNavItem[]) => {
    setItems(next);
    setDirty(true);
    setMessage(null);
  };
  const patchItem = (index: number, patch: Partial<WebsiteNavItem>) =>
    update(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const patchChild = (index: number, ci: number, patch: Partial<WebsiteNavChild>) =>
    patchItem(index, {
      children: (items[index]!.children ?? []).map((c, j) => (j === ci ? { ...c, ...patch } : c)),
    });

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/website-nav", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setItems(d.items ?? items);
      setDirty(false);
      setMessage({ ok: true, text: "已儲存，網站重新整理後就會看到新的頁首選單。" });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "儲存失敗" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 py-2 md:px-0">
      <AdminPageHeader
        title="頁首選單"
        description="網站最上方的選單。可以新增、排序、暫時隱藏，也可以在選單底下放子選單。手機版會放在選單按鈕（☰）裡。"
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1 rounded-md border border-input px-3 text-sm text-[#153E73] hover:bg-[#FFFDF6]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              看網站
            </a>
            <Button onClick={save} disabled={saving || loading || !dirty}>
              {saving ? "儲存中…" : dirty ? "儲存變更" : "已儲存"}
            </Button>
          </div>
        }
      />

      {!GROUP_BUY_CONSUMER_VISIBLE ? (
        <p className="rounded-xl border border-[#E9EDF2] bg-[#F7F8FA] px-3 py-2 text-sm text-[#687386]">
          團購目前暫不對外：連到「團購」頁的選單會自動在網站上隱藏，團購開放後就會出現。
        </p>
      ) : null}

      {message ? (
        <p
          className={
            message.ok
              ? "rounded-xl bg-[#E8F8EF] px-3 py-2 text-sm text-[#1B6B3A]"
              : "rounded-xl bg-[#FDE8E6] px-3 py-2 text-sm text-[#B42318]"
          }
        >
          {message.text}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#8A94A6]">載入中…</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`rounded-2xl border bg-white p-4 ${item.enabled ? "border-[#E9EDF2]" : "border-dashed border-[#D0D5DD] opacity-70"}`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF5CC] text-xs font-bold text-[#153E73]">
                  {index + 1}
                </span>
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-[#153E73]">選單名稱</span>
                    <Input
                      value={item.label}
                      maxLength={12}
                      onChange={(e) => patchItem(index, { label: e.target.value })}
                    />
                  </label>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#153E73]">連到哪裡</span>
                    <LinkField href={item.href} onChange={(href) => patchItem(index, { href })} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button type="button" variant="outline" size="sm" title="上移" disabled={index === 0} onClick={() => update(move(items, index, index - 1))}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" title="下移" disabled={index === items.length - 1} onClick={() => update(move(items, index, index + 1))}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="刪除"
                    onClick={() => {
                      if (window.confirm(`確定刪除「${item.label}」？`)) update(items.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#B42318]" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 pl-9 text-sm text-[#153E73]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={item.enabled} onChange={(e) => patchItem(index, { enabled: e.target.checked })} />
                  顯示在網站
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(item.newTab)} onChange={(e) => patchItem(index, { newTab: e.target.checked })} />
                  另開新分頁
                </label>
              </div>

              <div className="mt-3 space-y-2 pl-9">
                {(item.children ?? []).map((child, ci) => (
                  <div key={child.id} className="grid gap-2 rounded-xl bg-[#FAFBFC] p-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                    <Input
                      value={child.label}
                      placeholder="子選單名稱"
                      maxLength={16}
                      onChange={(e) => patchChild(index, ci, { label: e.target.value })}
                    />
                    <LinkField href={child.href} onChange={(href) => patchChild(index, ci, { href })} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="刪除子選單"
                      onClick={() =>
                        patchItem(index, { children: (item.children ?? []).filter((_, j) => j !== ci) })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#B42318]" />
                    </Button>
                  </div>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#79C7E8] hover:underline"
                  onClick={() =>
                    patchItem(index, {
                      children: [...(item.children ?? []), { id: newNavId("sub"), label: "新子選單", href: "/" }],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  新增子選單（滑過時展開）
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {!loading ? (
        <Button
          type="button"
          variant="outline"
          disabled={items.length >= WEBSITE_NAV_MAX_ITEMS}
          onClick={() =>
            update([...items, { id: newNavId(), label: "新選單", href: "/", enabled: true, children: [] }])
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          新增選單
          {items.length >= WEBSITE_NAV_MAX_ITEMS ? `（最多 ${WEBSITE_NAV_MAX_ITEMS} 個）` : ""}
        </Button>
      ) : null}
    </div>
  );
}
