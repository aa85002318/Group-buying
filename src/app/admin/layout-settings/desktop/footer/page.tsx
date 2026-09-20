"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_DESKTOP_FOOTER_SETTINGS,
  type DesktopFooterSettings,
} from "@/lib/desktop/footer-settings";

type LinkRow = { label: string; href: string };

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Editable list of { label, href } rows with add / reorder / delete. */
function LinkListEditor({
  links,
  onChange,
  addLabel = "新增連結",
  labelPlaceholder = "顯示文字",
}: {
  links: LinkRow[];
  onChange: (next: LinkRow[]) => void;
  addLabel?: string;
  labelPlaceholder?: string;
}) {
  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
          <Input
            value={link.label}
            placeholder={labelPlaceholder}
            onChange={(e) => onChange(links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))}
          />
          <Input
            value={link.href}
            placeholder="/support 或 https://…"
            className="font-mono text-xs"
            onChange={(e) => onChange(links.map((l, j) => (j === i ? { ...l, href: e.target.value } : l)))}
          />
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" title="上移" disabled={i === 0} onClick={() => onChange(move(links, i, i - 1))}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="outline" size="sm" title="下移" disabled={i === links.length - 1} onClick={() => onChange(move(links, i, i + 1))}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="outline" size="sm" title="刪除" onClick={() => onChange(links.filter((_, j) => j !== i))}>
              <Trash2 className="h-3.5 w-3.5 text-[#B42318]" />
            </Button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#79C7E8] hover:underline"
        onClick={() => onChange([...links, { label: "", href: "/" }])}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-[#E9EDF2] bg-white p-4">
      <div>
        <h2 className="text-sm font-bold text-[#153E73]">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-[#8A94A6]">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function AdminFooterPage() {
  const [settings, setSettings] = useState<DesktopFooterSettings>(DEFAULT_DESKTOP_FOOTER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/desktop-footer")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? DEFAULT_DESKTOP_FOOTER_SETTINGS))
      .catch(() => setSettings(DEFAULT_DESKTOP_FOOTER_SETTINGS))
      .finally(() => {
        setLoading(false);
        setDirty(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<DesktopFooterSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setDirty(true);
    setMessage(null);
  };

  const save = async () => {
    const clean = (rows: LinkRow[]) => rows.filter((r) => r.label.trim() && r.href.trim());
    const payload: DesktopFooterSettings = {
      ...settings,
      columns: settings.columns
        .filter((c) => c.title.trim())
        .map((c) => ({ ...c, links: clean(c.links) })),
      social_links: clean(settings.social_links),
      bottom_links: clean(settings.bottom_links),
    };
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/desktop-footer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setSettings(d.settings);
      setDirty(false);
      setMessage({ ok: true, text: "已儲存，網站重新整理後就會看到新的頁尾。" });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "儲存失敗" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 py-2 md:px-0">
      <AdminPageHeader
        title="頁尾"
        description="網站最下方的品牌介紹、連結欄、社群帳號與版權文字。空白的連結儲存時會自動略過。"
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
        <>
          <Card title="品牌介紹" hint="顯示在頁尾最左邊的 Logo 下方。">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">標語</span>
              <Input value={settings.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">介紹文字</span>
              <textarea
                className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.about}
                onChange={(e) => set({ about: e.target.value })}
              />
            </label>
          </Card>

          <Card title="連結欄" hint="每一欄有自己的標題與連結，建議 3～4 欄。">
            <div className="space-y-4">
              {settings.columns.map((col, ci) => (
                <div key={ci} className="space-y-3 rounded-xl bg-[#FAFBFC] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      className="max-w-xs font-semibold"
                      value={col.title}
                      placeholder="欄位標題"
                      onChange={(e) =>
                        set({ columns: settings.columns.map((c, j) => (j === ci ? { ...c, title: e.target.value } : c)) })
                      }
                    />
                    <div className="ml-auto flex gap-1">
                      <Button type="button" variant="outline" size="sm" title="左移" disabled={ci === 0} onClick={() => set({ columns: move(settings.columns, ci, ci - 1) })}>
                        <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" title="右移" disabled={ci === settings.columns.length - 1} onClick={() => set({ columns: move(settings.columns, ci, ci + 1) })}>
                        <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        title="刪除這一欄"
                        onClick={() => {
                          if (window.confirm(`確定刪除「${col.title || "這一欄"}」？`))
                            set({ columns: settings.columns.filter((_, j) => j !== ci) });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[#B42318]" />
                      </Button>
                    </div>
                  </div>
                  <LinkListEditor
                    links={col.links}
                    onChange={(links) =>
                      set({ columns: settings.columns.map((c, j) => (j === ci ? { ...c, links } : c)) })
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                disabled={settings.columns.length >= 5}
                onClick={() => set({ columns: [...settings.columns, { title: "新欄位", links: [] }] })}
              >
                <Plus className="mr-1 h-4 w-4" />
                新增一欄{settings.columns.length >= 5 ? "（最多 5 欄）" : ""}
              </Button>
            </div>
          </Card>

          <Card title="社群帳號">
            <label className="flex items-center gap-2 text-sm text-[#153E73]">
              <input type="checkbox" checked={settings.show_social} onChange={(e) => set({ show_social: e.target.checked })} />
              顯示社群連結
            </label>
            <LinkListEditor
              links={settings.social_links}
              onChange={(social_links) => set({ social_links })}
              addLabel="新增社群帳號"
              labelPlaceholder="例如 LINE、Facebook"
            />
          </Card>

          <Card title="電子報／加入會員">
            <label className="flex items-center gap-2 text-sm text-[#153E73]">
              <input
                type="checkbox"
                checked={settings.newsletter_enabled}
                onChange={(e) => set({ newsletter_enabled: e.target.checked })}
              />
              顯示這一欄
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[#153E73]">標題</span>
                <Input value={settings.newsletter_title} onChange={(e) => set({ newsletter_title: e.target.value })} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[#153E73]">說明文字</span>
                <Input
                  value={settings.newsletter_placeholder}
                  onChange={(e) => set({ newsletter_placeholder: e.target.value })}
                />
              </label>
            </div>
          </Card>

          <Card title="最下方版權列" hint="「{year}」會自動換成今年年份。">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">版權文字</span>
              <Input value={settings.copyright} onChange={(e) => set({ copyright: e.target.value })} />
            </label>
            <LinkListEditor
              links={settings.bottom_links}
              onChange={(bottom_links) => set({ bottom_links })}
              addLabel="新增版權列連結"
            />
          </Card>
        </>
      )}
    </div>
  );
}
