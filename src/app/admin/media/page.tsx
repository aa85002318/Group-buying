"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy, FolderOpen, Loader2, Search, Trash2, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MEDIA_LIBRARY_FOLDERS,
  folderLabel,
  type MediaAsset,
} from "@/lib/admin/media-library";
import { cn } from "@/lib/utils";

export default function AdminMediaLibraryPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [folder, setFolder] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (folder !== "all") params.set("folder", folder);
      if (q.trim()) params.set("q", q.trim());
      params.set("limit", "120");
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setItems(data.items ?? []);
      if (data.warning) setError(data.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [folder, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "product-images");
      form.append("folder", folder === "all" ? "cms/general" : folder);
      form.append("register_library", "1");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上傳失敗");
      setMessage("已上傳並加入素材庫");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("從素材庫移除這筆紀錄？（不會刪除其他頁面已使用的圖片網址）")) return;
    const res = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "刪除失敗");
      return;
    }
    setMessage("已從素材庫移除");
    await load();
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("已複製圖片網址");
    } catch {
      setError("複製失敗");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="素材庫"
        description="集中管理 CMS／Banner 圖片。上傳後可在各 CMS 圖片欄位「從素材庫選擇」。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/recipes/media">
              <Button type="button" variant="outline" size="sm">
                食譜素材庫
              </Button>
            </Link>
            <Button
              type="button"
              size="sm"
              className="border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1 h-3.5 w-3.5" />
              )}
              上傳圖片
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            folder === "all" ? "bg-[#FFE149] text-[#153E73]" : "bg-white text-[#153E73]/70 border border-[#E5E8EE]"
          )}
          onClick={() => setFolder("all")}
        >
          全部
        </button>
        {MEDIA_LIBRARY_FOLDERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold",
              folder === f.id
                ? "bg-[#FFE149] text-[#153E73]"
                : "border border-[#E5E8EE] bg-white text-[#153E73]/70"
            )}
            onClick={() => setFolder(f.id)}
          >
            <FolderOpen className="h-3 w-3" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#756B64]" />
          <Input
            className="pl-8"
            placeholder="搜尋檔名／Alt"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load();
            }}
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void load()}>
          搜尋
        </Button>
      </div>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#756B64]">載入中…</p>
      ) : items.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#E5E8EE] bg-[#F7F8FA] p-10 text-center">
          <p className="text-sm text-[#756B64]">尚無素材，請先上傳圖片。</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[16px] border border-[#E5E8EE] bg-white"
            >
              <div className="relative aspect-[4/3] bg-[#F7F8FA]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.file_url}
                  alt={item.alt_text || item.file_name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-[#153E73]">{item.file_name}</p>
                <p className="text-[11px] text-[#756B64]">
                  {folderLabel(item.folder)}
                  {item.file_size != null ? ` · ${Math.round(item.file_size / 1024)}KB` : ""}
                  {item.created_at
                    ? ` · ${new Date(item.created_at).toLocaleDateString("zh-TW")}`
                    : ""}
                </p>
                {item.alt_text ? (
                  <p className="line-clamp-2 text-[11px] text-[#756B64]">{item.alt_text}</p>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void copyUrl(item.file_url)}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    複製網址
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void remove(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#C94C4C]" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
