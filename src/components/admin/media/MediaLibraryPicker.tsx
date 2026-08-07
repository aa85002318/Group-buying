"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, FolderOpen, Loader2, Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MEDIA_LIBRARY_FOLDERS,
  type MediaAsset,
} from "@/lib/admin/media-library";
import { cn } from "@/lib/utils";

type MediaLibraryPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  /** Prefill / filter folder */
  folder?: string;
};

export function MediaLibraryPicker({
  open,
  onClose,
  onSelect,
  folder = "cms/general",
}: MediaLibraryPickerProps) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [activeFolder, setActiveFolder] = useState(folder || "all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeFolder && activeFolder !== "all") params.set("folder", activeFolder);
      if (q.trim()) params.set("q", q.trim());
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
  }, [activeFolder, q]);

  useEffect(() => {
    if (!open) return;
    setActiveFolder(folder || "all");
    setSelectedId(null);
  }, [open, folder]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "product-images");
      form.append(
        "folder",
        activeFolder === "all" ? folder || "cms/general" : activeFolder
      );
      form.append("register_library", "1");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上傳失敗");
      await load();
      if (data.url) {
        onSelect({
          id: data.media_id ?? `tmp-${Date.now()}`,
          uploaded_by: null,
          file_name: file.name,
          file_url: data.url,
          mime_type: file.type,
          file_size: file.size,
          folder: activeFolder === "all" ? folder || "cms/general" : activeFolder,
          alt_text: null,
          created_at: new Date().toISOString(),
        });
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal
        aria-label="素材庫"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E5E8EE] px-4 py-3">
          <div>
            <p className="font-semibold text-[#153E73]">素材庫</p>
            <p className="text-xs text-[#756B64]">選擇既有圖片，或直接上傳並加入素材庫</p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E8EE] px-4 py-2">
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              activeFolder === "all"
                ? "bg-[#FFE149] text-[#153E73]"
                : "bg-[#F7F8FA] text-[#153E73]/70"
            )}
            onClick={() => setActiveFolder("all")}
          >
            全部
          </button>
          {MEDIA_LIBRARY_FOLDERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                activeFolder === f.id
                  ? "bg-[#FFE149] text-[#153E73]"
                  : "bg-[#F7F8FA] text-[#153E73]/70"
              )}
              onClick={() => setActiveFolder(f.id)}
            >
              <FolderOpen className="h-3 w-3" />
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          <div className="relative min-w-[180px] flex-1">
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
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            搜尋
          </Button>
          <label className="inline-flex cursor-pointer">
            <span
              className={cn(
                buttonVariantsLike(),
                uploading && "pointer-events-none opacity-60"
              )}
            >
              {uploading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1 h-3.5 w-3.5" />
              )}
              上傳
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {error ? (
          <p className="mx-4 mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          {loading ? (
            <p className="py-10 text-center text-sm text-[#756B64]">載入中…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#756B64]">此分類尚無素材</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => {
                const active = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl border bg-[#F7F8FA]",
                      active ? "border-[#FFE149] ring-2 ring-[#FFE149]" : "border-[#E5E8EE]"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.file_url}
                      alt={item.alt_text || item.file_name}
                      className="h-full w-full object-cover"
                    />
                    {active ? (
                      <span className="absolute right-1 top-1 rounded-full bg-[#153E73] p-0.5 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">
                      {item.file_name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E5E8EE] px-4 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            type="button"
            className="bg-[#153E73] text-white hover:bg-[#0f2f58]"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onSelect(selected);
              onClose();
            }}
          >
            使用此圖
          </Button>
        </div>
      </div>
    </div>
  );
}

function buttonVariantsLike() {
  return "inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent";
}
