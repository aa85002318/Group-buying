"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_DESKTOP_FOOTER_SETTINGS,
  type DesktopFooterSettings,
} from "@/lib/desktop/footer-settings";

export default function AdminDesktopFooterPage() {
  const [settings, setSettings] = useState<DesktopFooterSettings>(
    DEFAULT_DESKTOP_FOOTER_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/desktop-footer")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? DEFAULT_DESKTOP_FOOTER_SETTINGS))
      .catch(() => setSettings(DEFAULT_DESKTOP_FOOTER_SETTINGS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/desktop-footer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setSettings(d.settings);
      setMessage("已儲存 Desktop Footer（僅影響網頁版頁尾）");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 py-2 md:px-0">
      <AdminPageHeader
        title="網頁版頁尾設定"
        description="修改 Desktop Footer 文案與連結。不影響 Mobile App 頁尾。"
        actions={
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "儲存中…" : "儲存"}
          </Button>
        }
      />
      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <div className="space-y-6 rounded-xl border bg-white p-5">
          <label className="block text-sm">
            標語
            <Input
              className="mt-1"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            簡介
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              value={settings.about}
              onChange={(e) => setSettings({ ...settings, about: e.target.value })}
            />
          </label>

          {settings.columns.map((col, colIndex) => (
            <div key={col.title} className="rounded-lg border p-4">
              <label className="block text-sm font-semibold">
                欄位標題
                <Input
                  className="mt-1"
                  value={col.title}
                  onChange={(e) => {
                    const columns = [...settings.columns];
                    columns[colIndex] = { ...col, title: e.target.value };
                    setSettings({ ...settings, columns });
                  }}
                />
              </label>
              <div className="mt-3 space-y-2">
                {col.links.map((link, linkIndex) => (
                  <div key={`${colIndex}-${linkIndex}`} className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={link.label}
                      placeholder="名稱"
                      onChange={(e) => {
                        const columns = [...settings.columns];
                        const links = [...col.links];
                        links[linkIndex] = { ...link, label: e.target.value };
                        columns[colIndex] = { ...col, links };
                        setSettings({ ...settings, columns });
                      }}
                    />
                    <Input
                      value={link.href}
                      placeholder="/path"
                      onChange={(e) => {
                        const columns = [...settings.columns];
                        const links = [...col.links];
                        links[linkIndex] = { ...link, href: e.target.value };
                        columns[colIndex] = { ...col, links };
                        setSettings({ ...settings, columns });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.newsletter_enabled}
              onChange={(e) =>
                setSettings({ ...settings, newsletter_enabled: e.target.checked })
              }
            />
            顯示電子報區塊
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.show_social}
              onChange={(e) => setSettings({ ...settings, show_social: e.target.checked })}
            />
            顯示社群連結
          </label>
        </div>
      )}
    </div>
  );
}
