"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MediaUploaderProps = {
  url: string | null;
  onChange: (next: {
    url: string | null;
    path: string | null;
    width: number | null;
    height: number | null;
    fileSize: number | null;
  }) => void;
  label: string;
  hint?: string;
  folder: string;
  bucket?: string;
  aspect?: "square" | "contain" | "banner52";
  previewContain?: boolean;
};

function formatBytes(n: number | null) {
  if (!n || n <= 0) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Single-image CMS uploader: click, drag & drop, preview, replace, delete.
 * Stores public URL in the DB — never Base64.
 */
export function MediaUploader({
  url,
  onChange,
  label,
  hint,
  folder,
  bucket = "cms-assets",
  aspect = "square",
  previewContain = false,
}: MediaUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [meta, setMeta] = useState<{ w: number | null; h: number | null; size: number | null }>({
    w: null,
    h: null,
    size: null,
  });

  const aspectClass =
    aspect === "banner52" ? "aspect-[5/2]" : aspect === "contain" ? "aspect-square" : "aspect-square";

  const readImageSize = (src: string) =>
    new Promise<{ w: number; h: number }>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = src;
    });

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        setError("僅支援 PNG、JPEG、WebP");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("檔案不可超過 5MB");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "上傳失敗");
        return;
      }
      const size = await readImageSize(data.url);
      setMeta({ w: size.w || null, h: size.h || null, size: file.size });
      onChange({
        url: data.url,
        path: data.path ?? null,
        width: size.w || null,
        height: size.h || null,
        fileSize: file.size,
      });
    } catch {
      setError("上傳失敗");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-coffee">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>

      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-[#F7F8FA]">
          <div className={cn("relative w-full", aspectClass)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full",
                previewContain ? "object-contain p-3" : "object-cover"
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border bg-white px-2 py-1.5 text-[11px] text-muted-foreground">
            <span>
              {[
                meta.w && meta.h ? `${meta.w} × ${meta.h}` : null,
                formatBytes(meta.size),
              ]
                .filter(Boolean)
                .join(" · ") || "已上傳"}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50"
              onClick={() => {
                onChange({ url: null, path: null, width: null, height: null, fileSize: null });
                setMeta({ w: null, h: null, size: null });
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              刪除
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-6 text-sm text-muted-foreground transition",
            dragOver ? "border-[#153E73] bg-[#EEF8FC]" : "border-border bg-[#F7F8FA] hover:bg-white"
          )}
        >
          <ImagePlus className="h-6 w-6 text-[#153E73]/50" />
          {uploading ? "上傳中…" : "點擊或拖放圖片"}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />

      {url ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {uploading ? "上傳中…" : "更換圖片"}
        </Button>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
