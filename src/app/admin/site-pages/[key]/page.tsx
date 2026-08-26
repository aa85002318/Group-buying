"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { sanitizeCmsHtml } from "@/lib/cms/safeHtml";
import { SITE_DOCUMENT_META } from "@/lib/site-pages/defaults";
import { isSiteDocumentKey, type SiteLegalDocument } from "@/lib/site-pages/types";

export default function AdminSiteDocumentEditorPage() {
  const params = useParams<{ key: string }>();
  const key = params.key;
  const valid = isSiteDocumentKey(key);
  const meta = valid ? SITE_DOCUMENT_META[key] : null;

  const [doc, setDoc] = useState<SiteLegalDocument | null>(null);
  const [defaultContent, setDefaultContent] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("1.0");
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) {
      setLoading(false);
      return;
    }
    fetch(`/api/admin/site-pages/${key}`)
      .then((r) => r.json())
      .then((d) => {
        const item = d.document as SiteLegalDocument;
        setDoc(item);
        setDefaultContent(d.defaultContent ?? "");
        setTitle(item.title);
        setContent(item.content);
        setVersion(item.document_version || "1.0");
        setPublished(item.is_published);
      })
      .finally(() => setLoading(false));
  }, [key, valid]);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/site-pages/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          document_version: version,
          is_published: published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setDoc(data.document);
      setMessage("已儲存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (!valid || !meta) {
    return <p className="text-sm text-error">找不到此文件</p>;
  }

  const useRichEditor = meta.format === "html";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/site-pages" className="text-[#153E73]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <AdminPageHeader
          title={meta.title}
          description={`${meta.description}。前台路徑：${meta.previewPath}`}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[#8A94A6]">載入中…</p>
      ) : (
        <div className="max-w-3xl space-y-4 rounded-xl bg-white p-5 shadow-card">
          <Input
            placeholder="頁面標題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="版本（例：1.0）"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              發布至前台
            </label>
          </div>
          <p className="text-xs text-[#8A94A6]">
            {useRichEditor
              ? "可用工具列調整文字大小（數字）、顏色、行距等。發布後前台會立即改用此文案。"
              : "純文字內容，前台會保留換行。儲存時會同步客服設定中的配送說明。"}
            {key === "shipping"
              ? " 發布後會同步出現在每一個商品頁的「配送注意事項」。"
              : ""}
          </p>
          {useRichEditor ? (
            <AdminRichTextEditor
              value={content}
              onChange={setContent}
              placeholder="輸入頁面內容…"
            />
          ) : (
            <textarea
              className="input-field min-h-[360px] w-full font-mono text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            <Button variant="outline" onClick={() => setPreview((v) => !v)}>
              {preview ? "關閉預覽" : "預覽"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm("還原為系統預設文案？")) setContent(defaultContent);
              }}
            >
              還原預設
            </Button>
            <a
              href={meta.previewPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-md px-3 text-sm text-[#153E73] underline"
            >
              開啟前台
            </a>
          </div>
          {doc ? (
            <p className="text-xs text-[#8A94A6]">
              上次更新：{new Date(doc.updated_at).toLocaleString("zh-TW")}
            </p>
          ) : null}
          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          {preview ? (
            <div className="rounded-xl border border-[#E7EAF0] bg-[#FFFDF6] p-4 text-sm">
              <h3 className="mb-3 font-bold text-[#153E73]">{title || meta.title}</h3>
              {useRichEditor ? (
                <div
                  className="space-y-4 leading-relaxed [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(content) }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-[#153E73]">{content}</pre>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
