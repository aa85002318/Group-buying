"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type View = {
  enabled: boolean;
  channelId: string;
  channelSecretMasked: string;
  channelSecretConfigured: boolean;
  channelAccessTokenMasked: string;
  channelAccessTokenConfigured: boolean;
  botBasicId: string;
  adminNotes: string;
  webhookUrl: string;
};

export default function AdminLineOaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [form, setForm] = useState({
    enabled: false,
    channelId: "",
    channelSecret: "",
    channelAccessToken: "",
    botBasicId: "",
    adminNotes: "",
  });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/integrations/line-oa")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setView(data as View);
        setForm({
          enabled: Boolean(data.enabled),
          channelId: String(data.channelId ?? ""),
          channelSecret: "",
          channelAccessToken: "",
          botBasicId: String(data.botBasicId ?? ""),
          adminNotes: String(data.adminNotes ?? ""),
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrations/line-oa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setView(data as View);
      setForm((f) => ({ ...f, channelSecret: "", channelAccessToken: "" }));
      setMessage("已儲存 LINE 私域設定（Messaging API 串接可後續接上）");
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-foreground-muted">載入中…</p>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="LINE 私域串接"
        description="設定 LINE 官方帳號（Messaging API），用於好友互動、推播與私域經營。金鑰僅後台可改。"
      />

      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-4 rounded-2xl border border-border bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-coffee">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="h-4 w-4 rounded border-border"
          />
          啟用 LINE 官方帳號串接
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-coffee">Channel ID</span>
            <Input
              value={form.channelId}
              onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-coffee">Bot Basic ID（選填）</span>
            <Input
              value={form.botBasicId}
              onChange={(e) => setForm((f) => ({ ...f, botBasicId: e.target.value }))}
              placeholder="@chimeidiy"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-coffee">
              Channel Secret
              {view?.channelSecretConfigured ? (
                <span className="ml-2 font-normal text-foreground-muted">目前：{view.channelSecretMasked}</span>
              ) : null}
            </span>
            <Input
              type="password"
              value={form.channelSecret}
              onChange={(e) => setForm((f) => ({ ...f, channelSecret: e.target.value }))}
              placeholder={view?.channelSecretConfigured ? "留空＝不變更" : "請輸入 Channel Secret"}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-coffee">
              Channel Access Token
              {view?.channelAccessTokenConfigured ? (
                <span className="ml-2 font-normal text-foreground-muted">
                  目前：{view.channelAccessTokenMasked}
                </span>
              ) : null}
            </span>
            <Input
              type="password"
              value={form.channelAccessToken}
              onChange={(e) => setForm((f) => ({ ...f, channelAccessToken: e.target.value }))}
              placeholder={view?.channelAccessTokenConfigured ? "留空＝不變更" : "請輸入長期 Access Token"}
            />
          </label>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3 text-xs text-foreground-muted">
          <p className="font-semibold text-coffee">Webhook URL（請填到 LINE Official Account）</p>
          <code className="mt-1 block break-all text-[11px] text-[#153E73]">{view?.webhookUrl}</code>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-coffee">內部備註</span>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={form.adminNotes}
            onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
          />
        </label>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "儲存中…" : "儲存"}
          </Button>
          <Button variant="outline" onClick={load} disabled={saving}>
            重新載入
          </Button>
        </div>
      </section>
    </div>
  );
}
