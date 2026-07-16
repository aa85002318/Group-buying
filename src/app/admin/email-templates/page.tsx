"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import type { EmailTemplateId, EmailTemplateRecord } from "@/lib/email/template-store";

const TABS: Array<{ id: EmailTemplateId; label: string }> = [
  { id: "order_confirmation", label: "訂單確認信件" },
  { id: "order_unpaid", label: "尚未付款通知" },
  { id: "order_cancelled", label: "取消訂單通知" },
];

type Placeholder = { key: string; desc: string };

export default function AdminEmailTemplatesPage() {
  const [activeId, setActiveId] = useState<EmailTemplateId>("order_confirmation");
  const [templates, setTemplates] = useState<Record<string, EmailTemplateRecord>>({});
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [form, setForm] = useState<EmailTemplateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewing, setPreviewing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-templates");
      const data = await res.json();
      const map: Record<string, EmailTemplateRecord> = {};
      for (const t of (data.templates ?? []) as EmailTemplateRecord[]) {
        map[t.id] = t;
      }
      setTemplates(map);
      setPlaceholders(data.placeholders ?? []);
      setForm(map[activeId] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (templates[activeId]) {
      setForm({ ...templates[activeId] });
      setPreviewHtml("");
      setPreviewSubject("");
    }
  }, [activeId, templates]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "儲存失敗");
        return;
      }
      setTemplates((prev) => ({ ...prev, [data.template.id]: data.template }));
      setForm(data.template);
      alert("版型已儲存");
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    if (!form) return;
    setPreviewing(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "預覽失敗");
        return;
      }
      setPreviewSubject(data.subject ?? "");
      setPreviewHtml(data.html ?? "");
    } finally {
      setPreviewing(false);
    }
  };

  if (loading || !form) {
    return <p className="text-sm text-muted-foreground">載入版型…</p>;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="郵件版型"
        description="編輯訂單確認、尚未付款、取消訂單通知的主旨與內文"
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeId === tab.id ? "default" : "secondary"}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-coffee">可用變數（會自動替換）</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {placeholders.map((p) => (
            <li key={p.key}>
              <code className="rounded bg-white px-1">{p.key}</code> — {p.desc}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 rounded-xl bg-white p-4 shadow-card">
        <div>
          <label className="mb-1 block text-sm font-medium">信件主旨</label>
          <Input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="【{{brand}}】訂單成立 {{order_no}}"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">預覽摘要（收件匣顯示）</label>
          <Input
            value={form.preheader}
            onChange={(e) => setForm({ ...form, preheader: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">標題</label>
          <Input
            value={form.heading}
            onChange={(e) => setForm({ ...form, heading: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">開頭說明（可調文字大小／顏色）</label>
          <AdminRichTextEditor
            value={form.intro_html}
            onChange={(intro_html) => setForm({ ...form, intro_html })}
            placeholder="輸入信件開頭說明…"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">結尾備註</label>
          <textarea
            className="input-field min-h-[72px]"
            value={form.footer_note}
            onChange={(e) => setForm({ ...form, footer_note: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">按鈕文字</label>
          <Input
            value={form.button_label}
            onChange={(e) => setForm({ ...form, button_label: e.target.value })}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          訂單編號、商品明細、金額等區塊會自動帶入，無需在版型中手動填寫。
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "儲存中…" : "儲存版型"}
          </Button>
          <Button variant="secondary" onClick={preview} disabled={previewing}>
            {previewing ? "產生預覽…" : "預覽效果"}
          </Button>
        </div>
      </div>

      {previewHtml && (
        <div className="space-y-2 rounded-xl border border-border bg-white p-4 shadow-card">
          <p className="text-sm font-medium text-coffee">預覽主旨：{previewSubject}</p>
          <iframe
            title="email-preview"
            className="h-[520px] w-full rounded-lg border border-border bg-[#F5F0EB]"
            srcDoc={previewHtml}
          />
        </div>
      )}
    </div>
  );
}
